"use client";

import {
  onValue,
  push,
  ref,
  set,
  type Unsubscribe,
} from "firebase/database";
import { db } from "../../../../services/firebase";
import {
  buscarClientePorTelefone,
  criarCliente,
} from "../clientes/ClienteFirebase";
import type {
  Agendamento,
  NovoAgendamento,
} from "./AgendaTypes";

const ESTABELECIMENTO_ID = "qr-beauty-demo";

function caminhoAgenda(dataISO: string) {
  return `beauty-v2/estabelecimentos/${ESTABELECIMENTO_ID}/agenda/${dataISO}`;
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

export function observarAgendamentos(
  dataISO: string,
  aoAtualizar: (agendamentos: Agendamento[]) => void,
  aoFalhar: (erro: Error) => void
): Unsubscribe {
  const agendaRef = ref(db, caminhoAgenda(dataISO));

  return onValue(
    agendaRef,
    (snapshot) => {
      const dados = snapshot.val() as
        | Record<string, Omit<Agendamento, "id">>
        | null;

      if (!dados) {
        aoAtualizar([]);
        return;
      }

      const agendamentos = Object.entries(dados)
        .map(([id, agendamento]) => ({
          id,
          ...agendamento,
        }))
        .sort((a, b) => a.horario.localeCompare(b.horario));

      aoAtualizar(agendamentos);
    },
    (erro) => {
      console.error("Erro ao observar a agenda:", erro);
      aoFalhar(
        new Error("Não foi possível carregar os agendamentos.")
      );
    }
  );
}

async function localizarOuCriarCliente(
  agendamento: NovoAgendamento
) {
  const clienteExistente = await buscarClientePorTelefone(
    agendamento.telefone
  );

  if (clienteExistente) {
    return {
      clienteId: clienteExistente.id,
      clienteNome: clienteExistente.nome,
      clienteTelefone: clienteExistente.telefone,
      clienteNovo: false,
    };
  }

  const novoCliente = await criarCliente({
    nome: agendamento.cliente,
    telefone: agendamento.telefone,
    status: "ativo",
    origem: "agenda",
    observacoes: agendamento.observacoes,
  });

  return {
    clienteId: novoCliente.id,
    clienteNome: novoCliente.nome,
    clienteTelefone: novoCliente.telefone,
    clienteNovo: true,
  };
}

export async function criarAgendamento(
  agendamento: NovoAgendamento
): Promise<Agendamento> {
  if (!agendamento.dataISO) {
    throw new Error("A data do agendamento não foi informada.");
  }

  const clienteVinculado =
    await localizarOuCriarCliente(agendamento);

  const criadoEm = Date.now();
  const agendaRef = ref(db, caminhoAgenda(agendamento.dataISO));
  const novoAgendamentoRef = push(agendaRef);

  if (!novoAgendamentoRef.key) {
    throw new Error("Não foi possível gerar o ID do agendamento.");
  }

  const dados: Omit<Agendamento, "id"> = {
    ...agendamento,

    clienteId: clienteVinculado.clienteId,
    cliente: clienteVinculado.clienteNome,
    telefone: clienteVinculado.clienteTelefone,
    clienteNovo: clienteVinculado.clienteNovo,

    criadoEm,
    atualizadoEm: criadoEm,
  };

  await set(
    novoAgendamentoRef,
    removerValoresIndefinidos(dados)
  );

  return {
    id: novoAgendamentoRef.key,
    ...dados,
  };
}
