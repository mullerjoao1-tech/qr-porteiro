import "server-only";

import type { Auth, UserRecord } from "firebase-admin/auth";
import type { Database } from "firebase-admin/database";

export type OrigemReutilizacaoPessoa =
  | "cpf"
  | "email"
  | "novo";

export type DadosBuscarOuCriarPessoa = {
  auth: Auth;
  database: Database;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  senhaProvisoria?: string;
  origem: string;
};

export type ResultadoBuscarOuCriarPessoa = {
  uid: string;
  usuarioAuth: UserRecord;
  criadoNoAuthentication: boolean;
  reutilizado: boolean;
  encontradoPor: OrigemReutilizacaoPessoa;
  cpfNormalizado?: string;
  emailPrincipal: string;
  emailInformado: string;
};

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export function normalizarCpf(valor: unknown): string {
  return texto(valor).replace(/\D/g, "");
}

function cpfValido(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcular = (base: string, pesoInicial: number) => {
    let soma = 0;

    for (let indice = 0; indice < base.length; indice += 1) {
      soma += Number(base[indice]) * (pesoInicial - indice);
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcular(cpf.slice(0, 9), 10);
  const segundo = calcular(`${cpf.slice(0, 9)}${primeiro}`, 11);

  return cpf.endsWith(`${primeiro}${segundo}`);
}

export function validarCpf(
  valor: unknown,
  obrigatorio = false
): string {
  const cpf = normalizarCpf(valor);

  if (!cpf && !obrigatorio) return "";

  if (!cpf) {
    throw new Error("O CPF é obrigatório.");
  }

  if (!cpfValido(cpf)) {
    throw new Error("Digite um CPF válido.");
  }

  return cpf;
}

async function buscarUidPorCpf(
  database: Database,
  cpf: string
): Promise<string | null> {
  if (!cpf) return null;

  const indice = await database
    .ref(`indices-v2/cpf/${cpf}`)
    .get();

  if (indice.exists() && typeof indice.val() === "string") {
    return String(indice.val());
  }

  const consulta = await database
    .ref("usuarios-v2")
    .orderByChild("cpf")
    .equalTo(cpf)
    .limitToFirst(1)
    .get();

  if (!consulta.exists()) return null;

  const dados = consulta.val() as Record<string, unknown>;
  return Object.keys(dados)[0] || null;
}

async function buscarPorEmail(
  auth: Auth,
  email: string
): Promise<UserRecord | null> {
  try {
    return await auth.getUserByEmail(email);
  } catch (erro) {
    const codigo =
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro
        ? String((erro as { code?: unknown }).code ?? "")
        : "";

    if (codigo === "auth/user-not-found") return null;
    throw erro;
  }
}

function validarSenhaNova(senha: string): string {
  if (senha.length < 6) {
    throw new Error(
      "A senha provisória precisa ter pelo menos 6 caracteres."
    );
  }

  return senha;
}

export async function buscarOuCriarPessoaUniversal(
  dados: DadosBuscarOuCriarPessoa
): Promise<ResultadoBuscarOuCriarPessoa> {
  const nome = texto(dados.nome);
  const email = texto(dados.email).toLowerCase();
  const telefone = texto(dados.telefone);
  const cpf = validarCpf(dados.cpf, false);

  if (!nome) {
    throw new Error("O nome da pessoa é obrigatório.");
  }

  if (!email) {
    throw new Error("O e-mail da pessoa é obrigatório.");
  }

  let usuarioAuth: UserRecord | null = null;
  let encontradoPor: OrigemReutilizacaoPessoa = "novo";

  if (cpf) {
    const uidCpf = await buscarUidPorCpf(dados.database, cpf);

    if (uidCpf) {
      usuarioAuth = await dados.auth.getUser(uidCpf);
      encontradoPor = "cpf";
    }
  }

  if (!usuarioAuth) {
    usuarioAuth = await buscarPorEmail(dados.auth, email);

    if (usuarioAuth) {
      encontradoPor = "email";
    }
  }

  let criadoNoAuthentication = false;

  if (!usuarioAuth) {
    const senha = validarSenhaNova(texto(dados.senhaProvisoria));

    usuarioAuth = await dados.auth.createUser({
      email,
      password: senha,
      displayName: nome,
      disabled: false,
    });

    criadoNoAuthentication = true;
    encontradoPor = "novo";
  }

  const uid = usuarioAuth.uid;
  const agora = Date.now();
  const referenciaUsuario = dados.database.ref(`usuarios-v2/${uid}`);
  const snapshotUsuario = await referenciaUsuario.get();

  const usuarioAnterior = snapshotUsuario.exists()
    ? (snapshotUsuario.val() as {
        criadoEm?: number;
        email?: string;
        primeiroAcesso?: boolean;
        precisaTrocarSenha?: boolean;
        origem?: string;
      })
    : null;

  const emailPrincipal =
    texto(usuarioAnterior?.email) ||
    texto(usuarioAuth.email) ||
    email;

  const atualizacao: Record<string, unknown> = {
    uid,
    nome,
    email: emailPrincipal,
    telefone,
    status: "ativo",
    atualizadoEm: agora,
    criadoEm: usuarioAnterior?.criadoEm ?? agora,
    primeiroAcesso:
      usuarioAnterior?.primeiroAcesso ?? criadoNoAuthentication,
    precisaTrocarSenha:
      usuarioAnterior?.precisaTrocarSenha ?? criadoNoAuthentication,
    origem: usuarioAnterior?.origem ?? dados.origem,
  };

  if (cpf) {
    atualizacao.cpf = cpf;
  }

  if (email !== emailPrincipal) {
    atualizacao[
      `emailsAlternativos/${email.replace(/[.#$[\]]/g, "_")}`
    ] = true;
  }

  await referenciaUsuario.update(atualizacao);

  const indices: Record<string, string> = {
    [`indices-v2/email/${email.replace(/[.#$[\]]/g, "_")}`]: uid,
  };

  if (cpf) {
    indices[`indices-v2/cpf/${cpf}`] = uid;
  }

  await dados.database.ref().update(indices);

  return {
    uid,
    usuarioAuth,
    criadoNoAuthentication,
    reutilizado: !criadoNoAuthentication,
    encontradoPor,
    cpfNormalizado: cpf || undefined,
    emailPrincipal,
    emailInformado: email,
  };
}

