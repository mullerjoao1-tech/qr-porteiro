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
      dados: ConfiguracaoCondominioImplantacao;
    }
  | {
      tipo: "beauty";
      dados: ConfiguracaoBeautyImplantacao;
    }
  | {
      tipo:
        | "barbearia"
        | "clinica"
        | "empresa"
        | "residencia"
        | "restaurante"
        | "outro";
      dados: Record<string, boolean | number | string>;
    };

export type ContextoImplantacao = {
  database: Database;
  criadoEm: number;
  criadoPorUid: string;

  local: {
    localId: string;
    localNome: string;
    localSlug: string;
    tipoLocal: TipoLocalImplantacao;
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

  configuracaoSegmento: ConfiguracaoSegmentoImplantacao;
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
  tipoLocal: TipoLocalImplantacao;
  estruturasCriadas: string[];
  etapas: EtapaImplantacao[];
  mensagem: string;
  detalhes?: Record<string, boolean | number | string>;
};

type LocalPrincipalBanco = {
  id?: string;
  localId?: string;
  nome?: string;
  slug?: string;
  tipo?: string;
  tipoLocal?: string;
  segmento?: string;
  status?: string;
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

export function normalizarSlugLocal(
  valor: string
): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function texto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function validarContexto(
  contexto: ContextoImplantacao
): void {
  if (!contexto.database) {
    throw new Error(
      "Database não informado."
    );
  }

  const localId =
    contexto.local.localId.trim();

  const localNome =
    contexto.local.localNome.trim();

  const localSlug =
    contexto.local.localSlug.trim();

  const criadoPorUid =
    contexto.criadoPorUid.trim();

  const responsavelUid =
    contexto.responsavel.uid.trim();

  const responsavelNome =
    contexto.responsavel.nome.trim();

  const responsavelEmail =
    contexto.responsavel.email.trim();

  if (!localId) {
    throw new Error(
      "LocalId não informado."
    );
  }

  if (!localNome) {
    throw new Error(
      "LocalNome não informado."
    );
  }

  if (!localSlug) {
    throw new Error(
      "LocalSlug não informado."
    );
  }

  if (!criadoPorUid) {
    throw new Error(
      "UID de quem está implantando não informado."
    );
  }

  if (!responsavelUid) {
    throw new Error(
      "UID do responsável não informado."
    );
  }

  if (!responsavelNome) {
    throw new Error(
      "Nome do responsável não informado."
    );
  }

  if (!responsavelEmail) {
    throw new Error(
      "E-mail do responsável não informado."
    );
  }

  if (!contexto.configuracaoSegmento) {
    throw new Error(
      "A configuração do segmento não foi informada."
    );
  }

  if (
    contexto.configuracaoSegmento.tipo !==
    contexto.local.tipoLocal
  ) {
    throw new Error(
      "A configuração enviada não corresponde ao tipo do local."
    );
  }

  const slugNormalizado =
    normalizarSlugLocal(localSlug);

  if (!slugNormalizado) {
    throw new Error(
      "O slug informado não é válido."
    );
  }

  if (slugNormalizado !== localSlug) {
    throw new Error(
      `O slug deve estar padronizado. Use "${slugNormalizado}".`
    );
  }
}

async function validarLocalPrincipal(
  contexto: ContextoImplantacao
): Promise<void> {
  const localId =
    contexto.local.localId.trim();

  const localSlug =
    contexto.local.localSlug.trim();

  const localNome =
    contexto.local.localNome.trim();

  const tipoLocal =
    contexto.local.tipoLocal;

  const snapshot =
    await contexto.database
      .ref(
        `locais-v2/${localId}`
      )
      .get();

  if (!snapshot.exists()) {
    throw new Error(
      `O local "${localId}" ainda não foi criado em locais-v2.`
    );
  }

  const local =
    snapshot.val() as LocalPrincipalBanco;

  const idBanco =
    texto(
      local.id ||
      local.localId
    );

  const slugBanco =
    texto(local.slug);

  const nomeBanco =
    texto(local.nome);

  const tipoBanco =
    texto(
      local.tipo ||
      local.tipoLocal ||
      local.segmento
    );

  if (
    idBanco &&
    idBanco !== localId
  ) {
    throw new Error(
      `O local "${localId}" possui ID divergente em locais-v2.`
    );
  }

  if (
    slugBanco &&
    slugBanco !== localSlug
  ) {
    throw new Error(
      `O local "${localId}" possui slug diferente em locais-v2.`
    );
  }

  if (
    nomeBanco &&
    nomeBanco !== localNome
  ) {
    throw new Error(
      `O local "${localId}" possui nome diferente em locais-v2.`
    );
  }

  if (
    tipoBanco &&
    tipoBanco !== tipoLocal
  ) {
    throw new Error(
      `O local "${localId}" possui tipo diferente em locais-v2.`
    );
  }

  if (local.status === "inativo") {
    throw new Error(
      `O local "${localId}" está inativo.`
    );
  }
}

export async function executarImplantacao(
  contexto: ContextoImplantacao
): Promise<ResultadoImplantadorSegmento> {
  validarContexto(contexto);

  /*
   * O Cadastro Universal já é executado pela API:
   * app/api/implantacao/criar-responsavel/route.ts
   *
   * Aqui apenas confirmamos que o local principal
   * existe e corresponde ao contexto recebido.
   */
  await validarLocalPrincipal(
    contexto
  );

  switch (contexto.local.tipoLocal) {
    case "condominio":
      return implantarCondominio(
        contexto
      );

    case "beauty":
      return implantarBeauty(
        contexto
      );

    case "residencia":
      return implantarResidencia(
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

    case "restaurante":
      throw new Error(
        "Implantador de Restaurante ainda não implementado."
      );

    case "outro":
      throw new Error(
        "Implantador para o tipo Outro ainda não implementado."
      );

    default: {
      const tipoNaoSuportado: never =
        contexto.local.tipoLocal;

      throw new Error(
        `Tipo de local não suportado: ${tipoNaoSuportado}`
      );
    }
  }
}
