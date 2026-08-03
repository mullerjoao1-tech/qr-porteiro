"use client";

import {
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  set,
  update,
  equalTo,
  type Unsubscribe,
} from "firebase/database";
import { db } from "../../../../services/firebase";
import type {
  AtualizacaoClienteBeauty,
  ClienteBeauty,
  NovoClienteBeauty,
} from "./ClienteTypes";

const ESTABELECIMENTO_ID = "qr-beauty-demo";

function caminhoClientes() {
  return `beauty-v2/estabelecimentos/${ESTABELECIMENTO_ID}/clientes`;
}

export function normalizarTelefone(telefone: string) {
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
    ).reduce<Record<string, unknown>>((resultado, [chave, item]) => {
      if (item === undefined) {
        return resultado;
      }

      resultado[chave] = removerValoresIndefinidos(item);
      return resultado;
    }, {});

    return objetoLimpo as T;
  }

  return valor;
}

function ordenarClientes(clientes: ClienteBeauty[]) {
  return [...clientes].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    })
  );
}

export function observarClientes(
  aoAtualizar: (clientes: ClienteBeauty[]) => void,
  aoFalhar: (erro: Error) => void
): Unsubscribe {
  const clientesRef = ref(db, caminhoClientes());

  return onValue(
    clientesRef,
    (snapshot) => {
      const dados = snapshot.val() as
        | Record<string, Omit<ClienteBeauty, "id">>
        | null;

      if (!dados) {
        aoAtualizar([]);
        return;
      }

      const clientes = Object.entries(dados).map(
        ([id, cliente]) => ({
          id,
          ...cliente,
        })
      );

      aoAtualizar(ordenarClientes(clientes));
    },
    (erro) => {
      console.error("Erro ao observar clientes do QR Beauty:", erro);
      aoFalhar(
        new Error("Não foi possível carregar os clientes.")
      );
    }
  );
}

export async function buscarClientePorTelefone(
  telefone: string
): Promise<ClienteBeauty | null> {
  const telefoneNormalizado = normalizarTelefone(telefone);

  if (!telefoneNormalizado) {
    return null;
  }

  const clientesRef = ref(db, caminhoClientes());
  const consulta = query(
    clientesRef,
    orderByChild("telefoneNormalizado"),
    equalTo(telefoneNormalizado)
  );

  const snapshot = await get(consulta);

  if (!snapshot.exists()) {
    return null;
  }

  const dados = snapshot.val() as Record<
    string,
    Omit<ClienteBeauty, "id">
  >;

  const primeiroResultado = Object.entries(dados)[0];

  if (!primeiroResultado) {
    return null;
  }

  const [id, cliente] = primeiroResultado;

  return {
    id,
    ...cliente,
  };
}

export async function criarCliente(
  novoCliente: NovoClienteBeauty
): Promise<ClienteBeauty> {
  const nome = novoCliente.nome.trim();
  const telefone = novoCliente.telefone.trim();
  const telefoneNormalizado = normalizarTelefone(telefone);

  if (!nome) {
    throw new Error("Digite o nome do cliente.");
  }

  if (!telefoneNormalizado) {
    throw new Error("Digite um telefone válido.");
  }

  const clienteExistente =
    await buscarClientePorTelefone(telefoneNormalizado);

  if (clienteExistente) {
    throw new Error(
      "Já existe um cliente cadastrado com este telefone."
    );
  }

  const criadoEm = Date.now();
  const novoClienteRef = push(ref(db, caminhoClientes()));

  if (!novoClienteRef.key) {
    throw new Error("Não foi possível gerar o ID do cliente.");
  }

  const dados: Omit<ClienteBeauty, "id"> = {
    nome,
    telefone,
    telefoneNormalizado,
    email: novoCliente.email?.trim() || undefined,
    nascimento: novoCliente.nascimento || undefined,
    observacoes: novoCliente.observacoes?.trim() || undefined,

    status: novoCliente.status,
    origem: novoCliente.origem,

    totalVisitas: 0,
    valorTotalGasto: 0,
    ultimaVisita: undefined,

    profissionalPreferido:
      novoCliente.profissionalPreferido?.trim() || undefined,
    servicosPreferidos: novoCliente.servicosPreferidos || [],
    tags: novoCliente.tags || [],

    criadoEm,
    atualizadoEm: criadoEm,
  };

  await set(
    novoClienteRef,
    removerValoresIndefinidos(dados)
  );

  return {
    id: novoClienteRef.key,
    ...dados,
  };
}

export async function atualizarCliente(
  clienteId: string,
  alteracoes: AtualizacaoClienteBeauty
) {
  if (!clienteId) {
    throw new Error("Cliente não informado.");
  }

  const dadosAtualizados: Record<string, unknown> = {
    ...alteracoes,
    atualizadoEm: Date.now(),
  };

  if (typeof alteracoes.nome === "string") {
    dadosAtualizados.nome = alteracoes.nome.trim();
  }

  if (typeof alteracoes.telefone === "string") {
    const telefone = alteracoes.telefone.trim();
    const telefoneNormalizado = normalizarTelefone(telefone);

    if (!telefoneNormalizado) {
      throw new Error("Digite um telefone válido.");
    }

    const clienteExistente =
      await buscarClientePorTelefone(telefoneNormalizado);

    if (
      clienteExistente &&
      clienteExistente.id !== clienteId
    ) {
      throw new Error(
        "Já existe outro cliente cadastrado com este telefone."
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

  if (typeof alteracoes.observacoes === "string") {
    dadosAtualizados.observacoes =
      alteracoes.observacoes.trim() || null;
  }

  await update(
    ref(db, `${caminhoClientes()}/${clienteId}`),
    removerValoresIndefinidos(dadosAtualizados)
  );
}

export async function alterarStatusCliente(
  clienteId: string,
  status: "ativo" | "inativo"
) {
  await atualizarCliente(clienteId, { status });
}
