"use client";

import {
  get,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

import {
  db,
} from "../firebase";

export type StatusResponsavelUnidade =
  | "disponivel"
  | "ausente";

export type VinculoResponsavelUnidade = {
  id:
    string;

  usuarioId:
    string;

  unidadeId:
    string;

  nome:
    string;

  telefone?:
    string;

  prioridade:
    number;

  status:
    StatusResponsavelUnidade;

  ativo:
    boolean;

  criadoEm?:
    number;

  atualizadoEm?:
    number;
};

type NovoVinculoResponsavel = {
  usuarioId:
    string;

  unidadeId:
    string;

  nome:
    string;

  telefone?:
    string;

  prioridade:
    number;

  status?:
    StatusResponsavelUnidade;

  ativo?:
    boolean;
};

function limparTexto(
  valor:
    unknown
): string {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

function numeroPrioridade(
  valor:
    unknown
): number {
  const numero =
    Number(
      valor
    );

  if (
    !Number.isFinite(
      numero
    ) ||
    numero < 1
  ) {
    return 1;
  }

  return Math.floor(
    numero
  );
}

function normalizarVinculo(
  id:
    string,
  unidadeId:
    string,
  valor:
    Partial<
      VinculoResponsavelUnidade
    >
): VinculoResponsavelUnidade {
  return {
    id,

    usuarioId:
      limparTexto(
        valor.usuarioId
      ) ||
      id,

    unidadeId:
      limparTexto(
        valor.unidadeId
      ) ||
      unidadeId,

    nome:
      limparTexto(
        valor.nome
      ) ||
      "Responsável",

    telefone:
      limparTexto(
        valor.telefone
      ) ||
      undefined,

    prioridade:
      numeroPrioridade(
        valor.prioridade
      ),

    status:
      valor.status ===
      "ausente"
        ? "ausente"
        : "disponivel",

    ativo:
      valor.ativo !==
      false,

    criadoEm:
      valor.criadoEm,

    atualizadoEm:
      valor.atualizadoEm,
  };
}

export async function listarResponsaveisVinculados(
  unidadeId:
    string
): Promise<
  VinculoResponsavelUnidade[]
> {
  const unidadeLimpa =
    limparTexto(
      unidadeId
    );

  if (!unidadeLimpa) {
    return [];
  }

  const snapshot =
    await get(
      ref(
        db,
        `unidades-v2/${unidadeLimpa}/responsaveis`
      )
    );

  const dados =
    snapshot.val() as
      Record<
        string,
        Partial<
          VinculoResponsavelUnidade
        >
      > | null;

  if (!dados) {
    return [];
  }

  return Object.entries(
    dados
  )
    .map(
      (
        [
          id,
          valor,
        ]
      ) =>
        normalizarVinculo(
          id,
          unidadeLimpa,
          valor
        )
    )
    .filter(
      (
        responsavel
      ) =>
        responsavel.ativo
    )
    .sort(
      (
        a,
        b
      ) => {
        if (
          a.prioridade !==
          b.prioridade
        ) {
          return (
            a.prioridade -
            b.prioridade
          );
        }

        return a.nome.localeCompare(
          b.nome,
          "pt-BR"
        );
      }
    );
}

export async function salvarResponsavelVinculado(
  dados:
    NovoVinculoResponsavel
): Promise<void> {
  const usuarioId =
    limparTexto(
      dados.usuarioId
    );

  const unidadeId =
    limparTexto(
      dados.unidadeId
    );

  const nome =
    limparTexto(
      dados.nome
    );

  if (!usuarioId) {
    throw new Error(
      "O usuário do responsável não foi informado."
    );
  }

  if (!unidadeId) {
    throw new Error(
      "A unidade não foi informada."
    );
  }

  if (!nome) {
    throw new Error(
      "O nome do responsável não foi informado."
    );
  }

  const agora =
    Date.now();

  const caminho =
    `unidades-v2/${unidadeId}/responsaveis/${usuarioId}`;

  const existente =
    await get(
      ref(
        db,
        caminho
      )
    );

  await set(
    ref(
      db,
      caminho
    ),
    {
      usuarioId,

      unidadeId,

      nome,

      telefone:
        limparTexto(
          dados.telefone
        ) ||
        null,

      prioridade:
        numeroPrioridade(
          dados.prioridade
        ),

      status:
        dados.status ===
        "ausente"
          ? "ausente"
          : "disponivel",

      ativo:
        dados.ativo !==
        false,

      criadoEm:
        existente.exists()
          ? existente.val()
              ?.criadoEm ||
            agora
          : agora,

      atualizadoEm:
        agora,
    }
  );
}

export async function atualizarStatusResponsavel(
  unidadeId:
    string,
  usuarioId:
    string,
  status:
    StatusResponsavelUnidade
): Promise<void> {
  await update(
    ref(
      db,
      `unidades-v2/${unidadeId}/responsaveis/${usuarioId}`
    ),
    {
      status,

      atualizadoEm:
        Date.now(),
    }
  );
}

export async function atualizarPrioridadeResponsavel(
  unidadeId:
    string,
  usuarioId:
    string,
  prioridade:
    number
): Promise<void> {
  await update(
    ref(
      db,
      `unidades-v2/${unidadeId}/responsaveis/${usuarioId}`
    ),
    {
      prioridade:
        numeroPrioridade(
          prioridade
        ),

      atualizadoEm:
        Date.now(),
    }
  );
}

export async function reorganizarPrioridades(
  unidadeId:
    string,
  usuariosOrdenados:
    string[]
): Promise<void> {
  const alteracoes:
    Record<
      string,
      number
    > = {};

  usuariosOrdenados.forEach(
    (
      usuarioId,
      indice
    ) => {
      alteracoes[
        `unidades-v2/${unidadeId}/responsaveis/${usuarioId}/prioridade`
      ] =
        indice +
        1;

      alteracoes[
        `unidades-v2/${unidadeId}/responsaveis/${usuarioId}/atualizadoEm`
      ] =
        Date.now();
    }
  );

  await update(
    ref(
      db
    ),
    alteracoes
  );
}

export async function removerResponsavelVinculado(
  unidadeId:
    string,
  usuarioId:
    string
): Promise<void> {
  await remove(
    ref(
      db,
      `unidades-v2/${unidadeId}/responsaveis/${usuarioId}`
    )
  );
}
