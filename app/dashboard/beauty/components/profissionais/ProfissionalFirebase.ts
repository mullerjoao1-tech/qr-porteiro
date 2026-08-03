"use client";

import {
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { db } from "../../../../services/firebase";
import type {
  NovoProfissionalBeauty,
  ProfissionalBeauty,
  StatusProfissional,
} from "./ProfissionalTypes";

const ESTABELECIMENTO_ID = "qr-beauty-demo";

function caminhoProfissionais() {
  return `beauty-v2/estabelecimentos/${ESTABELECIMENTO_ID}/profissionais`;
}

export function normalizarTelefoneProfissional(
  telefone: string
) {
  return telefone.replace(/\D/g, "");
}

function removerValoresIndefinidos<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => removerValoresIndefinidos(item))
      .filter((item) => item !== undefined) as T;
  }

  if (valor && typeof valor === "object") {
    const objetoLimpo = Object.entries(
      valor as Record<string, unknown>
    ).reduce<Record<string, unknown>>(
      (resultado, [chave, item]) => {
        if (item === undefined) {
          return resultado;
        }

        resultado[chave] =
          removerValoresIndefinidos(item);

        return resultado;
      },
      {}
    );

    return objetoLimpo as T;
  }

  return valor;
}

function ordenarProfissionais(
  profissionais: ProfissionalBeauty[]
) {
  return [...profissionais].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    })
  );
}

export function observarProfissionais(
  aoAtualizar: (
    profissionais: ProfissionalBeauty[]
  ) => void,
  aoFalhar: (erro: Error) => void
): Unsubscribe {
  const profissionaisRef = ref(
    db,
    caminhoProfissionais()
  );

  return onValue(
    profissionaisRef,
    (snapshot) => {
      const dados = snapshot.val() as
        | Record<
            string,
            Omit<ProfissionalBeauty, "id">
          >
        | null;

      if (!dados) {
        aoAtualizar([]);
        return;
      }

      const profissionais = Object.entries(dados).map(
        ([id, profissional]) => ({
          id,
          ...profissional,
          especialidades:
            profissional.especialidades || [],
          status: profissional.status || "ativo",
        })
      );

      aoAtualizar(
        ordenarProfissionais(profissionais)
      );
    },
    (erro) => {
      console.error(
        "Erro ao observar profissionais do QR Beauty:",
        erro
      );

      aoFalhar(
        new Error(
          "Não foi possível carregar os profissionais."
        )
      );
    }
  );
}

export async function buscarProfissionalPorTelefone(
  telefone: string
): Promise<ProfissionalBeauty | null> {
  const telefoneNormalizado =
    normalizarTelefoneProfissional(telefone);

  if (!telefoneNormalizado) {
    return null;
  }

  const profissionaisRef = ref(
    db,
    caminhoProfissionais()
  );

  const consulta = query(
    profissionaisRef,
    orderByChild("telefoneNormalizado"),
    equalTo(telefoneNormalizado)
  );

  const snapshot = await get(consulta);

  if (!snapshot.exists()) {
    return null;
  }

  const dados = snapshot.val() as Record<
    string,
    Omit<ProfissionalBeauty, "id">
  >;

  const primeiroResultado =
    Object.entries(dados)[0];

  if (!primeiroResultado) {
    return null;
  }

  const [id, profissional] = primeiroResultado;

  return {
    id,
    ...profissional,
    especialidades:
      profissional.especialidades || [],
    status: profissional.status || "ativo",
  };
}

export async function criarProfissional(
  novoProfissional: NovoProfissionalBeauty
): Promise<ProfissionalBeauty> {
  const nome = novoProfissional.nome.trim();
  const telefone =
    novoProfissional.telefone.trim();

  const telefoneNormalizado =
    normalizarTelefoneProfissional(telefone);

  if (!nome) {
    throw new Error(
      "Digite o nome do profissional."
    );
  }

  if (!telefoneNormalizado) {
    throw new Error(
      "Digite um telefone válido."
    );
  }

  const profissionalExistente =
    await buscarProfissionalPorTelefone(
      telefoneNormalizado
    );

  if (profissionalExistente) {
    throw new Error(
      "Já existe um profissional cadastrado com este telefone."
    );
  }

  const especialidades = (
    novoProfissional.especialidades || []
  )
    .map((especialidade) =>
      especialidade.trim()
    )
    .filter(Boolean);

  if (especialidades.length === 0) {
    throw new Error(
      "Informe pelo menos uma especialidade."
    );
  }

  const criadoEm = Date.now();

  const novoProfissionalRef = push(
    ref(db, caminhoProfissionais())
  );

  if (!novoProfissionalRef.key) {
    throw new Error(
      "Não foi possível gerar o ID do profissional."
    );
  }

  const dados: Omit<
    ProfissionalBeauty,
    "id"
  > = {
    nome,
    telefone,
    telefoneNormalizado,
    email:
      novoProfissional.email?.trim() ||
      undefined,
    fotoUrl:
      novoProfissional.fotoUrl?.trim() ||
      undefined,
    especialidades,
    status:
      novoProfissional.status || "ativo",
    corAgenda:
      novoProfissional.corAgenda?.trim() ||
      undefined,
    observacoes:
      novoProfissional.observacoes?.trim() ||
      undefined,
    jornada:
      novoProfissional.jornada || undefined,
    criadoEm,
    atualizadoEm: criadoEm,
  };

  await set(
    novoProfissionalRef,
    removerValoresIndefinidos(dados)
  );

  return {
    id: novoProfissionalRef.key,
    ...dados,
  };
}

type AtualizacaoProfissional = Partial<
  Omit<
    ProfissionalBeauty,
    | "id"
    | "criadoEm"
    | "atualizadoEm"
    | "telefoneNormalizado"
  >
>;

export async function atualizarProfissional(
  profissionalId: string,
  alteracoes: AtualizacaoProfissional
) {
  if (!profissionalId) {
    throw new Error(
      "Profissional não informado."
    );
  }

  const dadosAtualizados: Record<
    string,
    unknown
  > = {
    ...alteracoes,
    atualizadoEm: Date.now(),
  };

  if (typeof alteracoes.nome === "string") {
    const nome = alteracoes.nome.trim();

    if (!nome) {
      throw new Error(
        "Digite o nome do profissional."
      );
    }

    dadosAtualizados.nome = nome;
  }

  if (
    typeof alteracoes.telefone === "string"
  ) {
    const telefone =
      alteracoes.telefone.trim();

    const telefoneNormalizado =
      normalizarTelefoneProfissional(
        telefone
      );

    if (!telefoneNormalizado) {
      throw new Error(
        "Digite um telefone válido."
      );
    }

    const profissionalExistente =
      await buscarProfissionalPorTelefone(
        telefoneNormalizado
      );

    if (
      profissionalExistente &&
      profissionalExistente.id !==
        profissionalId
    ) {
      throw new Error(
        "Já existe outro profissional cadastrado com este telefone."
      );
    }

    dadosAtualizados.telefone = telefone;
    dadosAtualizados.telefoneNormalizado =
      telefoneNormalizado;
  }

  if (typeof alteracoes.email === "string") {
    dadosAtualizados.email =
      alteracoes.email.trim() || null;
  }

  if (
    typeof alteracoes.fotoUrl === "string"
  ) {
    dadosAtualizados.fotoUrl =
      alteracoes.fotoUrl.trim() || null;
  }

  if (
    typeof alteracoes.corAgenda === "string"
  ) {
    dadosAtualizados.corAgenda =
      alteracoes.corAgenda.trim() || null;
  }

  if (
    typeof alteracoes.observacoes ===
    "string"
  ) {
    dadosAtualizados.observacoes =
      alteracoes.observacoes.trim() || null;
  }

  if (
    Array.isArray(
      alteracoes.especialidades
    )
  ) {
    const especialidades =
      alteracoes.especialidades
        .map((especialidade) =>
          especialidade.trim()
        )
        .filter(Boolean);

    if (especialidades.length === 0) {
      throw new Error(
        "Informe pelo menos uma especialidade."
      );
    }

    dadosAtualizados.especialidades =
      especialidades;
  }

  await update(
    ref(
      db,
      `${caminhoProfissionais()}/${profissionalId}`
    ),
    removerValoresIndefinidos(
      dadosAtualizados
    )
  );
}

export async function alterarStatusProfissional(
  profissionalId: string,
  status: StatusProfissional
) {
  await atualizarProfissional(
    profissionalId,
    { status }
  );
}
