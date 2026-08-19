"use client";

import {
  get,
  push,
  ref,
  set,
  update,
} from "firebase/database";

import {
  db,
} from "../firebase";

import {
  listarResponsaveisVinculados,
} from "./VinculosResponsaveis";

export type StatusDisponibilidade =
  | "disponivel"
  | "ausente"
  | "ocupado"
  | "offline";

export type ResponsavelAtendimento = {
  id:
    string;

  codigo?:
    string;

  uid?:
    string;

  nome:
    string;

  telefone?:
    string;

  unidadeId:
    string;

  prioridade:
    number;

  ordemAtendimento:
    number;

  recebeChamadas:
    boolean;

  disponivel:
    boolean;

  statusDisponibilidade:
    StatusDisponibilidade;

  status:
    string;
};

export type ResultadoEncaminhamento = {
  sucesso:
    boolean;

  responsavel:
    ResponsavelAtendimento | null;

  motivo?:
    string;
};

type MoradorBanco = {
  codigo?:
    string;

  uid?:
    string;

  nome?:
    string;

  telefone?:
    string;

  unidadeId?:
    string;

  prioridade?:
    number;

  ordemAtendimento?:
    number;

  recebeChamadas?:
    boolean;

  disponivel?:
    boolean;

  statusDisponibilidade?:
    StatusDisponibilidade;

  status?:
    string;
};

function numeroSeguro(
  valor:
    unknown,
  padrao:
    number
): number {
  const convertido =
    Number(
      valor
    );

  return Number.isFinite(
    convertido
  )
    ? convertido
    : padrao;
}

function normalizarResponsavelLegado(
  id:
    string,
  dados:
    MoradorBanco
): ResponsavelAtendimento {
  const prioridade =
    numeroSeguro(
      dados.prioridade,
      999
    );

  const ordemAtendimento =
    numeroSeguro(
      dados.ordemAtendimento,
      prioridade
    );

  const statusDisponibilidade =
    dados.statusDisponibilidade ||
    (
      dados.disponivel ===
        false
        ? "ausente"
        : "disponivel"
    );

  return {
    id,

    codigo:
      dados.codigo,

    uid:
      dados.uid,

    nome:
      String(
        dados.nome ||
        "Responsável"
      ),

    telefone:
      dados.telefone,

    unidadeId:
      String(
        dados.unidadeId ||
        ""
      ),

    prioridade,

    ordemAtendimento,

    recebeChamadas:
      dados.recebeChamadas !==
      false,

    disponivel:
      dados.disponivel !==
      false,

    statusDisponibilidade,

    status:
      String(
        dados.status ||
        "ativo"
      ),
  };
}

function responsavelElegivel(
  responsavel:
    ResponsavelAtendimento
): boolean {
  if (
    responsavel.status !==
    "ativo"
  ) {
    return false;
  }

  if (
    responsavel.recebeChamadas ===
    false
  ) {
    return false;
  }

  if (
    responsavel.disponivel ===
    false
  ) {
    return false;
  }

  return (
    responsavel
      .statusDisponibilidade ===
    "disponivel"
  );
}

async function listarResponsaveisLegados(
  unidadeId:
    string
): Promise<
  ResponsavelAtendimento[]
> {
  const snapshot =
    await get(
      ref(
        db,
        "qrCentral/moradores"
      )
    );

  const dados =
    snapshot.val() as
      Record<
        string,
        MoradorBanco
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
        normalizarResponsavelLegado(
          id,
          valor
        )
    )
    .filter(
      (
        responsavel
      ) =>
        responsavel.unidadeId ===
        unidadeId
    )
    .sort(
      (
        a,
        b
      ) => {
        if (
          a.ordemAtendimento !==
          b.ordemAtendimento
        ) {
          return (
            a.ordemAtendimento -
            b.ordemAtendimento
          );
        }

        return a.nome.localeCompare(
          b.nome,
          "pt-BR"
        );
      }
    );
}

export async function listarResponsaveisDaUnidade(
  unidadeId:
    string
): Promise<
  ResponsavelAtendimento[]
> {
  const novos =
    await listarResponsaveisVinculados(
      unidadeId
    );

  if (
    novos.length >
    0
  ) {
    return novos.map(
      (
        responsavel
      ) => ({
        id:
          responsavel.id,

        uid:
          responsavel.usuarioId,

        nome:
          responsavel.nome,

        telefone:
          responsavel.telefone,

        unidadeId:
          responsavel.unidadeId,

        prioridade:
          responsavel.prioridade,

        ordemAtendimento:
          responsavel.prioridade,

        recebeChamadas:
          true,

        disponivel:
          responsavel.status ===
          "disponivel",

        statusDisponibilidade:
          responsavel.status,

        status:
          responsavel.ativo
            ? "ativo"
            : "inativo",
      })
    );
  }

  /*
   * Compatibilidade temporária:
   * enquanto uma unidade ainda não possuir responsáveis em
   * unidades-v2/{unidadeId}/responsaveis, o sistema continua
   * lendo os moradores antigos de qrCentral/moradores.
   */
  return listarResponsaveisLegados(
    unidadeId
  );
}

export async function obterProximoResponsavel(
  unidadeId:
    string,
  ignorarIds:
    string[] = []
): Promise<
  ResultadoEncaminhamento
> {
  const ignorados =
    new Set(
      ignorarIds
    );

  const responsaveis =
    await listarResponsaveisDaUnidade(
      unidadeId
    );

  const proximo =
    responsaveis.find(
      (
        responsavel
      ) =>
        !ignorados.has(
          responsavel.id
        ) &&
        responsavelElegivel(
          responsavel
        )
    );

  if (!proximo) {
    return {
      sucesso:
        false,

      responsavel:
        null,

      motivo:
        "Nenhum responsável disponível para esta unidade.",
    };
  }

  return {
    sucesso:
      true,

    responsavel:
      proximo,
  };
}

async function registrarHistoricoEscalonamento(
  caminhoChamada:
    string,
  dados: {
    tipo:
      | "encaminhada"
      | "recusada"
      | "atendida"
      | "sem-responsavel";

    responsavelId?:
      string;

    responsavelNome?:
      string;

    prioridade?:
      number;

    detalhes?:
      string;
  }
): Promise<void> {
  const historicoRef =
    push(
      ref(
        db,
        `${caminhoChamada}/historicoEscalonamento`
      )
    );

  await set(
    historicoRef,
    {
      ...dados,

      criadoEm:
        Date.now(),
    }
  );
}

export async function encaminharParaPrimeiroDisponivel(
  unidadeId:
    string,
  caminhoChamada:
    string
): Promise<
  ResultadoEncaminhamento
> {
  const resultado =
    await obterProximoResponsavel(
      unidadeId
    );

  if (
    !resultado.sucesso ||
    !resultado.responsavel
  ) {
    await update(
      ref(
        db,
        caminhoChamada
      ),
      {
        responsavelAtualId:
          null,

        responsavelAtualNome:
          null,

        aguardandoResponsavel:
          true,

        motivoSemResponsavel:
          resultado.motivo ||
          "Nenhum responsável disponível.",

        escalonamentoAtualizadoEm:
          Date.now(),
      }
    );

    await registrarHistoricoEscalonamento(
      caminhoChamada,
      {
        tipo:
          "sem-responsavel",

        detalhes:
          resultado.motivo,
      }
    );

    return resultado;
  }

  const responsavel =
    resultado.responsavel;

  await update(
    ref(
      db,
      caminhoChamada
    ),
    {
      responsavelAtualId:
        responsavel.id,

      responsavelAtualUid:
        responsavel.uid ||
        null,

      responsavelAtualNome:
        responsavel.nome,

      responsavelAtualPrioridade:
        responsavel.ordemAtendimento,

      aguardandoResponsavel:
        false,

      encaminhamentoAutomatico:
        true,

      escalonamentoAtualizadoEm:
        Date.now(),
    }
  );

  await registrarHistoricoEscalonamento(
    caminhoChamada,
    {
      tipo:
        "encaminhada",

      responsavelId:
        responsavel.id,

      responsavelNome:
        responsavel.nome,

      prioridade:
        responsavel
          .ordemAtendimento,

      detalhes:
        "Chamada encaminhada para o próximo responsável disponível.",
    }
  );

  return resultado;
}

export async function iniciarEscalonamento(
  unidadeId: string,
  caminhoChamada: string
): Promise<ResultadoEncaminhamento> {
  const resultado = await obterProximoResponsavel(
    unidadeId,
    []
  );

  if (
    !resultado.sucesso ||
    !resultado.responsavel
  ) {
    await update(
      ref(
        db,
        caminhoChamada
      ),
      {
        responsaveisIgnorados: [],
        responsavelAtualId: null,
        responsavelAtualUid: null,
        responsavelAtualNome: null,
        responsavelAtualPrioridade: null,
        aguardandoResponsavel: true,
        motivoSemResponsavel:
          resultado.motivo ||
          "Nenhum responsável disponível.",
        escalonamentoAtualizadoEm:
          Date.now(),
      }
    );

    await registrarHistoricoEscalonamento(
      caminhoChamada,
      {
        tipo: "sem-responsavel",
        detalhes:
          resultado.motivo ||
          "Nenhum responsável disponível.",
      }
    );

    return resultado;
  }

  const responsavel =
    resultado.responsavel;

  await update(
    ref(
      db,
      caminhoChamada
    ),
    {
      responsaveisIgnorados: [],

      responsavelAtualId:
        responsavel.id,

      responsavelAtualUid:
        responsavel.uid ||
        null,

      responsavelAtualNome:
        responsavel.nome,

      responsavelAtualPrioridade:
        responsavel.ordemAtendimento,

      aguardandoResponsavel:
        false,

      encaminhamentoAutomatico:
        true,

      escalonamentoAtualizadoEm:
        Date.now(),
    }
  );

  await registrarHistoricoEscalonamento(
    caminhoChamada,
    {
      tipo: "encaminhada",

      responsavelId:
        responsavel.id,

      responsavelNome:
        responsavel.nome,

      prioridade:
        responsavel.ordemAtendimento,

      detalhes:
        "Chamada iniciada pelo responsável de maior prioridade disponível.",
    }
  );

  return resultado;
}

export async function recusarEEncaminhar(
  unidadeId:
    string,
  caminhoChamada:
    string,
  responsavelAtualId:
    string
): Promise<
  ResultadoEncaminhamento
> {
  const chamadaSnapshot =
    await get(
      ref(
        db,
        caminhoChamada
      )
    );

  const chamada =
    chamadaSnapshot.val() ||
    {};

  const recusadosAnteriores =
    Array.isArray(
      chamada.responsaveisIgnorados
    )
      ? chamada.responsaveisIgnorados
      : [];

  const responsaveisIgnorados =
    Array.from(
      new Set(
        [
          ...recusadosAnteriores,
          responsavelAtualId,
        ]
      )
    );

  const responsaveis =
    await listarResponsaveisDaUnidade(
      unidadeId
    );

  const responsavelQueRecusou =
    responsaveis.find(
      (
        responsavel
      ) =>
        responsavel.id ===
        responsavelAtualId
    );

  await registrarHistoricoEscalonamento(
    caminhoChamada,
    {
      tipo:
        "recusada",

      responsavelId:
        responsavelAtualId,

      responsavelNome:
        responsavelQueRecusou
          ?.nome,

      prioridade:
        responsavelQueRecusou
          ?.ordemAtendimento,

      detalhes:
        'Responsável selecionou "Não posso atender".',
    }
  );

  const resultado =
    await obterProximoResponsavel(
      unidadeId,
      responsaveisIgnorados
    );

  if (
    !resultado.sucesso ||
    !resultado.responsavel
  ) {
    await update(
      ref(
        db,
        caminhoChamada
      ),
      {
        responsaveisIgnorados,

        responsavelAtualId:
          null,

        responsavelAtualUid:
          null,

        responsavelAtualNome:
          null,

        aguardandoResponsavel:
          true,

        motivoSemResponsavel:
          resultado.motivo ||
          "Nenhum outro responsável disponível.",

        escalonamentoAtualizadoEm:
          Date.now(),
      }
    );

    await registrarHistoricoEscalonamento(
      caminhoChamada,
      {
        tipo:
          "sem-responsavel",

        detalhes:
          resultado.motivo,
      }
    );

    return resultado;
  }

  const proximo =
    resultado.responsavel;

  await update(
    ref(
      db,
      caminhoChamada
    ),
    {
      responsaveisIgnorados,

      responsavelAtualId:
        proximo.id,

      responsavelAtualUid:
        proximo.uid ||
        null,

      responsavelAtualNome:
        proximo.nome,

      responsavelAtualPrioridade:
        proximo.ordemAtendimento,

      aguardandoResponsavel:
        false,

      escalonamentoAtualizadoEm:
        Date.now(),
    }
  );

  await registrarHistoricoEscalonamento(
    caminhoChamada,
    {
      tipo:
        "encaminhada",

      responsavelId:
        proximo.id,

      responsavelNome:
        proximo.nome,

      prioridade:
        proximo
          .ordemAtendimento,

      detalhes:
        "Chamada encaminhada após recusa do responsável anterior.",
    }
  );

  return resultado;
}

export async function registrarAtendimentoDoResponsavel(
  caminhoChamada:
    string,
  responsavel:
    ResponsavelAtendimento
): Promise<void> {
  await update(
    ref(
      db,
      caminhoChamada
    ),
    {
      status:
        "Em atendimento",

      notificar:
        false,

      atendidoPorId:
        responsavel.id,

      atendidoPorUid:
        responsavel.uid ||
        null,

      atendidoPorNome:
        responsavel.nome,

      atendidoEm:
        new Date()
          .toISOString(),

      ultimaAtividade:
        Date.now(),
    }
  );

  await registrarHistoricoEscalonamento(
    caminhoChamada,
    {
      tipo:
        "atendida",

      responsavelId:
        responsavel.id,

      responsavelNome:
        responsavel.nome,

      prioridade:
        responsavel
          .ordemAtendimento,

      detalhes:
        "Chamada atendida.",
    }
  );
}

