"use client";

import {
  onValue,
  push,
  ref,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { db } from "../../../../services/firebase";
import type {
  NovoServicoBeauty,
  ServicoBeauty,
  StatusServico,
} from "./ServicoTypes";

const ESTABELECIMENTO_ID = "qr-beauty-demo";

function caminhoServicos() {
  return `beauty-v2/estabelecimentos/${ESTABELECIMENTO_ID}/servicos`;
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

function ordenarServicos(servicos: ServicoBeauty[]) {
  return [...servicos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    })
  );
}

export function observarServicos(
  aoAtualizar: (servicos: ServicoBeauty[]) => void,
  aoFalhar: (erro: Error) => void
): Unsubscribe {
  const servicosRef = ref(db, caminhoServicos());

  return onValue(
    servicosRef,
    (snapshot) => {
      const dados = snapshot.val() as
        | Record<string, Omit<ServicoBeauty, "id">>
        | null;

      if (!dados) {
        aoAtualizar([]);
        return;
      }

      const servicos = Object.entries(dados).map(
        ([id, servico]) => ({
          id,
          ...servico,
          profissionalIds:
            servico.profissionalIds || [],
          status: servico.status || "ativo",
        })
      );

      aoAtualizar(ordenarServicos(servicos));
    },
    (erro) => {
      console.error(
        "Erro ao observar serviços do QR Beauty:",
        erro
      );

      aoFalhar(
        new Error(
          "Não foi possível carregar os serviços."
        )
      );
    }
  );
}

export async function criarServico(
  novoServico: NovoServicoBeauty
): Promise<ServicoBeauty> {
  const nome = novoServico.nome.trim();
  const categoria = novoServico.categoria.trim();
  const valor = Number(novoServico.valor);
  const duracaoMinutos = Number(
    novoServico.duracaoMinutos
  );

  if (!nome) {
    throw new Error("Digite o nome do serviço.");
  }

  if (!categoria) {
    throw new Error(
      "Digite a categoria do serviço."
    );
  }

  if (
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    throw new Error(
      "Digite um valor válido para o serviço."
    );
  }

  if (
    !Number.isFinite(duracaoMinutos) ||
    duracaoMinutos <= 0
  ) {
    throw new Error(
      "Digite uma duração válida para o serviço."
    );
  }

  const criadoEm = Date.now();
  const novoServicoRef = push(
    ref(db, caminhoServicos())
  );

  if (!novoServicoRef.key) {
    throw new Error(
      "Não foi possível gerar o ID do serviço."
    );
  }

  const dados: Omit<ServicoBeauty, "id"> = {
    nome,
    categoria,
    valor,
    duracaoMinutos,
    profissionalIds:
      novoServico.profissionalIds || [],
    status: novoServico.status || "ativo",
    corAgenda:
      novoServico.corAgenda?.trim() ||
      undefined,
    descricao:
      novoServico.descricao?.trim() ||
      undefined,
    criadoEm,
    atualizadoEm: criadoEm,
  };

  await set(
    novoServicoRef,
    removerValoresIndefinidos(dados)
  );

  return {
    id: novoServicoRef.key,
    ...dados,
  };
}

type AtualizacaoServico = Partial<
  Omit<
    ServicoBeauty,
    "id" | "criadoEm" | "atualizadoEm"
  >
>;

export async function atualizarServico(
  servicoId: string,
  alteracoes: AtualizacaoServico
) {
  if (!servicoId) {
    throw new Error("Serviço não informado.");
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
        "Digite o nome do serviço."
      );
    }

    dadosAtualizados.nome = nome;
  }

  if (
    typeof alteracoes.categoria === "string"
  ) {
    const categoria =
      alteracoes.categoria.trim();

    if (!categoria) {
      throw new Error(
        "Digite a categoria do serviço."
      );
    }

    dadosAtualizados.categoria = categoria;
  }

  if (typeof alteracoes.valor === "number") {
    if (
      !Number.isFinite(alteracoes.valor) ||
      alteracoes.valor < 0
    ) {
      throw new Error(
        "Digite um valor válido para o serviço."
      );
    }

    dadosAtualizados.valor =
      alteracoes.valor;
  }

  if (
    typeof alteracoes.duracaoMinutos ===
    "number"
  ) {
    if (
      !Number.isFinite(
        alteracoes.duracaoMinutos
      ) ||
      alteracoes.duracaoMinutos <= 0
    ) {
      throw new Error(
        "Digite uma duração válida para o serviço."
      );
    }

    dadosAtualizados.duracaoMinutos =
      alteracoes.duracaoMinutos;
  }

  if (
    Array.isArray(
      alteracoes.profissionalIds
    )
  ) {
    dadosAtualizados.profissionalIds =
      alteracoes.profissionalIds;
  }

  if (
    typeof alteracoes.corAgenda === "string"
  ) {
    dadosAtualizados.corAgenda =
      alteracoes.corAgenda.trim() || null;
  }

  if (
    typeof alteracoes.descricao === "string"
  ) {
    dadosAtualizados.descricao =
      alteracoes.descricao.trim() || null;
  }

  await update(
    ref(
      db,
      `${caminhoServicos()}/${servicoId}`
    ),
    removerValoresIndefinidos(
      dadosAtualizados
    )
  );
}

export async function alterarStatusServico(
  servicoId: string,
  status: StatusServico
) {
  await atualizarServico(servicoId, {
    status,
  });
}
