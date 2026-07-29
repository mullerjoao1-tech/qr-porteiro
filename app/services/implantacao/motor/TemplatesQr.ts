import "server-only";

export type TipoTemplateQr =
  | "compacto"
  | "explicativo";

export type TamanhoTemplateQr =
  | "a4"
  | "a5"
  | "quadrado"
  | "horizontal";

export type TemplateQr = {
  id: TipoTemplateQr;

  nome: string;

  descricao: string;

  tamanhoPadrao:
    TamanhoTemplateQr;

  largura: number;

  altura: number;

  tituloPadrao: string;

  subtituloPadrao: string;

  instrucaoPadrao: string;

  mostrarPassos: boolean;

  passos: string[];

  rodape: string;
};

export const TEMPLATE_QR_COMPACTO:
  TemplateQr = {
    id: "compacto",

    nome:
      "Modelo Compacto",

    descricao:
      "Modelo simples e direto, indicado para portarias, vidros, halls e entradas menores.",

    tamanhoPadrao:
      "a4",

    largura:
      1240,

    altura:
      1754,

    tituloPadrao:
      "ACESSO DE VISITANTES",

    subtituloPadrao:
      "Escaneie o QR Code para iniciar o atendimento.",

    instrucaoPadrao:
      "Aponte a câmera do celular para o QR Code.",

    mostrarPassos:
      false,

    passos: [],

    rodape:
      "QR ACESSO • Tudo na palma da mão",
  };

export const TEMPLATE_QR_EXPLICATIVO:
  TemplateQr = {
    id: "explicativo",

    nome:
      "Modelo Explicativo",

    descricao:
      "Modelo com instruções passo a passo, indicado para condomínios e locais com maior circulação.",

    tamanhoPadrao:
      "a4",

    largura:
      1240,

    altura:
      1754,

    tituloPadrao:
      "ACESSO DE VISITANTES",

    subtituloPadrao:
      "Escaneie o QR Code e siga as instruções.",

    instrucaoPadrao:
      "O atendimento será enviado diretamente para o responsável do local.",

    mostrarPassos:
      true,

    passos: [
      "Escaneie o QR Code.",
      "Escolha ou informe a unidade.",
      "Digite seu nome e o motivo da visita.",
      "Aguarde o atendimento.",
      "Converse pelo próprio sistema.",
    ],

    rodape:
      "QR ACESSO • Tudo na palma da mão",
  };

export const TEMPLATES_QR:
  Record<
    TipoTemplateQr,
    TemplateQr
  > = {
    compacto:
      TEMPLATE_QR_COMPACTO,

    explicativo:
      TEMPLATE_QR_EXPLICATIVO,
  };

export function obterTemplateQr(
  tipo:
    TipoTemplateQr
): TemplateQr {
  const template =
    TEMPLATES_QR[tipo];

  if (!template) {
    throw new Error(
      `Template de QR não encontrado: ${tipo}`
    );
  }

  return template;
}

export function listarTemplatesQr():
  TemplateQr[] {
  return Object.values(
    TEMPLATES_QR
  );
}