import "server-only";

import type {
  Database,
} from "firebase-admin/database";

import {
  implantarCondominio,
} from "./ImplantadorCondominio";

import {
  implantarBeauty,
} from "./ImplantadorBeauty";
import {
  implantarResidencia,
} from "./ImplantadorResidencia";

export type TipoLocalImplantacao =
  | "condominio"
  | "beauty"
  | "barbearia"
  | "clinica"
  | "empresa"
  | "residencia"
  | "restaurante"
  | "outro";

export type TipoCondominioImplantacao =
  | "vertical"
  | "horizontal"
  | "misto";

export type TipoPortariaImplantacao =
  | "sem-portaria"
  | "presencial-24h"
  | "presencial-horario"
  | "remota"
  | "hibrida";

export type ConfiguracaoCondominioImplantacao = {
  tipoCondominio: TipoCondominioImplantacao;
  quantidadeBlocos: number;
  apartamentosPorBloco: number;
  quantidadeCasas: number;
  possuiPortaria: boolean;
  tipoPortaria: TipoPortariaImplantacao;
  possuiVisitantes: boolean;
  possuiEntregas: boolean;
  possuiReservas: boolean;
  possuiCameras: boolean;
  possuiAberturaRemota: boolean;
  possuiPrestadores: boolean;
  possuiComunicados: boolean;
};

export type ConfiguracaoBeautyImplantacao = {
  quantidadeProfissionais: number;
  trabalhaComAgenda: boolean;
  possuiFilaEspera: boolean;
  possuiAntecipacaoAgenda: boolean;
  possuiConfirmacaoAutomatica: boolean;
  possuiCaixa: boolean;
  possuiEstoque: boolean;
  possuiCRM: boolean;
  possuiWhatsApp: boolean;
  possuiPainelTV: boolean;
};

export type ConfiguracaoSegmentoImplantacao =
  | {
      tipo: "condominio";
      dados:
        ConfiguracaoCondominioImplantacao;
    }
  | {
      tipo: "beauty";
      dados:
        ConfiguracaoBeautyImplantacao;
    }
  | {
      tipo:
        | "barbearia"
        | "clinica"
        | "empresa"
        | "residencia"
        | "restaurante"
        | "outro";
      dados: Record<
        string,
        boolean | number | string
      >;
    };

export type ContextoImplantacao = {
  database: Database;

  criadoEm: number;

  criadoPorUid: string;

  local: {
    localId: string;
    localNome: string;
    localSlug: string;
    tipoLocal:
      TipoLocalImplantacao;
    cidade?: string;
    estado?: string;
    endereco?: string;
  };

  responsavel: {
    uid: string;
    nome: string;
    email: string;
    telefone?: string;
    perfil: string;
  };

  configuracaoSegmento:
    ConfiguracaoSegmentoImplantacao;
};

export type EtapaImplantacao = {
  id: string;
  titulo: string;
  status:
    | "pendente"
    | "executando"
    | "concluida"
    | "falhou";
  mensagem?: string;
  iniciadoEm?: number;
  concluidoEm?: number;
};

export type ResultadoImplantadorSegmento = {
  sucesso: boolean;
  tipoLocal:
    TipoLocalImplantacao;
  estruturasCriadas: string[];
  etapas: EtapaImplantacao[];
  mensagem: string;
  detalhes?: Record<
    string,
    boolean | number | string
  >;
};

export function criarEtapa(
  id: string,
  titulo: string
): EtapaImplantacao {
  return {
    id,
    titulo,
    status: "pendente",
  };
}

export function iniciarEtapa(
  etapa: EtapaImplantacao,
  mensagem?: string
): EtapaImplantacao {
  return {
    ...etapa,
    status: "executando",
    mensagem,
    iniciadoEm: Date.now(),
  };
}

export function concluirEtapa(
  etapa: EtapaImplantacao,
  mensagem?: string
): EtapaImplantacao {
  return {
    ...etapa,
    status: "concluida",
    mensagem,
    concluidoEm: Date.now(),
  };
}

export function falharEtapa(
  etapa: EtapaImplantacao,
  mensagem: string
): EtapaImplantacao {
  return {
    ...etapa,
    status: "falhou",
    mensagem,
    concluidoEm: Date.now(),
  };
}

function validarContexto(
  contexto: ContextoImplantacao
): void {
  if (!contexto.database) {
    throw new Error(
      "Database não informado."
    );
  }

  if (
    !contexto.local.localId
      .trim()
  ) {
    throw new Error(
      "LocalId não informado."
    );
  }

  if (
    !contexto.local.localNome
      .trim()
  ) {
    throw new Error(
      "LocalNome não informado."
    );
  }

  if (
    !contexto.local.localSlug
      .trim()
  ) {
    throw new Error(
      "LocalSlug não informado."
    );
  }

  if (
    !contexto.responsavel.uid
      .trim()
  ) {
    throw new Error(
      "UID do responsável não informado."
    );
  }

  if (
    !contexto.configuracaoSegmento
  ) {
    throw new Error(
      "A configuração do segmento não foi informada."
    );
  }

  if (
    contexto.configuracaoSegmento
      .tipo !==
    contexto.local.tipoLocal
  ) {
    throw new Error(
      "A configuração enviada não corresponde ao tipo do local."
    );
  }
}

export async function executarImplantacao(
  contexto: ContextoImplantacao
): Promise<ResultadoImplantadorSegmento> {
  validarContexto(contexto);

  switch (
    contexto.local.tipoLocal
  ) {
    case "condominio":
      return implantarCondominio(
        contexto
      );

    case "beauty":
      return implantarBeauty(
        contexto
      );

    case "barbearia":
      throw new Error(
        "Implantador de Barbearia ainda não implementado."
      );

    case "clinica":
      throw new Error(
        "Implantador de Clínica ainda não implementado."
      );

    case "empresa":
      throw new Error(
        "Implantador de Empresa ainda não implementado."
      );

    case "residencia":
  return implantarResidencia(
    contexto
  );

    case "restaurante":
      throw new Error(
        "Implantador de Restaurante ainda não implementado."
      );

    default:
      throw new Error(
        `Tipo de local não suportado: ${contexto.local.tipoLocal}`
      );
  }
}
