import "server-only";

import type {
  ConfiguracaoSegmentoImplantacao,
  TipoLocalImplantacao,
} from "./ImplantadorUniversal";

import type {
  EstruturaUnidadesGerada,
} from "./types";

export type ImplantacaoContext = {
  iniciadoEm: number;

  finalizadoEm?: number;

  local: {
    id: string;

    nome: string;

    slug: string;

    tipo: TipoLocalImplantacao;

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

  configuracao:
    ConfiguracaoSegmentoImplantacao;

  estrutura?: EstruturaUnidadesGerada;

  firebase: {
    caminhos: string[];

  };

  links: {
    gerados: string[];

  };

  qrcodes: {
    gerados: string[];

  };

  permissoes: {
    criadas: string[];

  };

  hardware: {
    dispositivos: string[];

  };

  estatisticas: {
    totalEstruturas: number;

    totalUnidades: number;

    totalUsuarios: number;

    totalQrCodes: number;
  };

  resultado: {
    sucesso: boolean;

    mensagens: string[];

    avisos: string[];

    erros: string[];
  };
};

export function criarImplantacaoContext(
  parametros: {
    iniciadoEm: number;

    local: ImplantacaoContext["local"];

    responsavel:
      ImplantacaoContext["responsavel"];

    configuracao:
      ConfiguracaoSegmentoImplantacao;
  }
): ImplantacaoContext {
  return {
    iniciadoEm:
      parametros.iniciadoEm,

    local:
      parametros.local,

    responsavel:
      parametros.responsavel,

    configuracao:
      parametros.configuracao,

    firebase: {
      caminhos: [],
    },

    links: {
      gerados: [],
    },

    qrcodes: {
      gerados: [],
    },

    permissoes: {
      criadas: [],
    },

    hardware: {
      dispositivos: [],
    },

    estatisticas: {
      totalEstruturas: 0,

      totalUnidades: 0,

      totalUsuarios: 0,

      totalQrCodes: 0,
    },

    resultado: {
      sucesso: true,

      mensagens: [],

      avisos: [],

      erros: [],
    },
  };
}