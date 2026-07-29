import "server-only";

import type {
  ImplantacaoContext,
} from "../ImplantacaoContext";

export type TipoHardwareGerado =
  | "camera"
  | "portao"
  | "fechadura"
  | "interfone"
  | "controladora"
  | "leitor"
  | "outro";

export type StatusHardwareGerado =
  | "pendente-configuracao"
  | "ativo"
  | "inativo";

export type HardwareGerado = {
  id: string;

  localId: string;

  nome: string;

  tipo: TipoHardwareGerado;

  status: StatusHardwareGerado;

  unidadeId?: string;

  descricao: string;

  configuracao: {
    fabricante: string;

    modelo: string;

    protocolo: string;

    enderecoIp: string;

    identificadorExterno: string;

    homologado: boolean;
  };

  criadoEm: number;

  atualizadoEm: number;
};

export type ResultadoGeradorHardware = {
  contexto: ImplantacaoContext;

  dispositivos: HardwareGerado[];

  totalDispositivos: number;
};

function adicionarDispositivo(
  contexto: ImplantacaoContext,
  dispositivoId: string
): void {
  if (
    !contexto.hardware.dispositivos.includes(
      dispositivoId
    )
  ) {
    contexto.hardware.dispositivos.push(
      dispositivoId
    );
  }
}

function criarHardwareBase(
  contexto: ImplantacaoContext,
  parametros: {
    id: string;

    nome: string;

    tipo: TipoHardwareGerado;

    descricao: string;

    unidadeId?: string;
  }
): HardwareGerado {
  return {
    id:
      parametros.id,

    localId:
      contexto.local.id,

    nome:
      parametros.nome,

    tipo:
      parametros.tipo,

    status:
      "pendente-configuracao",

    unidadeId:
      parametros.unidadeId,

    descricao:
      parametros.descricao,

    configuracao: {
      fabricante: "",

      modelo: "",

      protocolo: "",

      enderecoIp: "",

      identificadorExterno: "",

      homologado: false,
    },

    criadoEm:
      contexto.iniciadoEm,

    atualizadoEm:
      contexto.iniciadoEm,
  };
}

export function gerarHardware(
  contexto: ImplantacaoContext
): ResultadoGeradorHardware {
  const dispositivos:
    HardwareGerado[] = [];

  if (
    contexto.configuracao.tipo ===
    "condominio"
  ) {
    const configuracao =
      contexto.configuracao.dados;

    if (
      configuracao.possuiCameras
    ) {
      dispositivos.push(
        criarHardwareBase(
          contexto,
          {
            id:
              `${contexto.local.id}-camera-principal`,

            nome:
              "Câmera principal",

            tipo:
              "camera",

            descricao:
              "Câmera principal do acesso do condomínio.",
          }
        )
      );
    }

    if (
      configuracao.possuiAberturaRemota
    ) {
      dispositivos.push(
        criarHardwareBase(
          contexto,
          {
            id:
              `${contexto.local.id}-portao-principal`,

            nome:
              "Portão principal",

            tipo:
              "portao",

            descricao:
              "Portão preparado para integração com abertura remota.",
          }
        )
      );

      dispositivos.push(
        criarHardwareBase(
          contexto,
          {
            id:
              `${contexto.local.id}-controladora-principal`,

            nome:
              "Controladora principal",

            tipo:
              "controladora",

            descricao:
              "Controladora preparada para integração com o sistema de acesso.",
          }
        )
      );
    }

    if (
      configuracao.possuiPortaria
    ) {
      dispositivos.push(
        criarHardwareBase(
          contexto,
          {
            id:
              `${contexto.local.id}-interfone-portaria`,

            nome:
              "Interfone da portaria",

            tipo:
              "interfone",

            descricao:
              "Interfone principal da operação de portaria.",
          }
        )
      );
    }
  }

  for (
    const dispositivo of
      dispositivos
  ) {
    adicionarDispositivo(
      contexto,
      dispositivo.id
    );
  }

  if (
    dispositivos.length === 0
  ) {
    contexto.resultado.avisos.push(
      "Nenhum hardware inicial foi solicitado para este local."
    );
  } else {
    contexto.resultado.mensagens.push(
      `${dispositivos.length} dispositivo(s) de hardware preparado(s).`
    );
  }

  return {
    contexto,

    dispositivos,

    totalDispositivos:
      dispositivos.length,
  };
}