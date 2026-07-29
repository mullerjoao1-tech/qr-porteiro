import "server-only";

import QRCode from "qrcode";

import type {
  QrLocalGerado,
} from "./GeradorQr";

import {
  obterTemplateQr,
  type TipoTemplateQr,
} from "./TemplatesQr";

export type FormatoImagemQr =
  | "png"
  | "svg";

export type ImagemQrGerada = {
  qrId: string;

  localId: string;

  localNome: string;

  localSlug: string;

  template:
    TipoTemplateQr;

  urlDestino: string;

  png: {
    formato: "png";

    mimeType:
      "image/png";

    buffer:
      Buffer;

    base64: string;

    dataUrl: string;

    tamanhoBytes:
      number;
  };

  svg: {
    formato: "svg";

    mimeType:
      "image/svg+xml";

    conteudo: string;

    base64: string;

    dataUrl: string;

    tamanhoBytes:
      number;
  };

  larguraQr: number;

  margemQr: number;

  criadoEm: number;
};

export type OpcoesGeradorQrImagem = {
  template?:
    TipoTemplateQr;

  larguraQr?: number;

  margemQr?: number;

  nivelCorrecao?:
    "L" | "M" | "Q" | "H";
};

function validarQr(
  qr: QrLocalGerado
): void {
  if (!qr.id.trim()) {
    throw new Error(
      "O ID do QR não foi informado."
    );
  }

  if (!qr.localId.trim()) {
    throw new Error(
      "O local do QR não foi informado."
    );
  }

  if (!qr.url.trim()) {
    throw new Error(
      "A URL de destino do QR não foi informada."
    );
  }
}

function normalizarLargura(
  largura?: number
): number {
  if (
    typeof largura !== "number" ||
    !Number.isFinite(largura)
  ) {
    return 900;
  }

  return Math.min(
    Math.max(
      Math.floor(largura),
      256
    ),
    2048
  );
}

function normalizarMargem(
  margem?: number
): number {
  if (
    typeof margem !== "number" ||
    !Number.isFinite(margem)
  ) {
    return 4;
  }

  return Math.min(
    Math.max(
      Math.floor(margem),
      1
    ),
    12
  );
}

export async function gerarQrImagem(
  qr: QrLocalGerado,
  opcoes:
    OpcoesGeradorQrImagem = {}
): Promise<ImagemQrGerada> {
  validarQr(qr);

  const tipoTemplate =
    opcoes.template ??
    "compacto";

  obterTemplateQr(
    tipoTemplate
  );

  const larguraQr =
    normalizarLargura(
      opcoes.larguraQr
    );

  const margemQr =
    normalizarMargem(
      opcoes.margemQr
    );

  const nivelCorrecao =
    opcoes.nivelCorrecao ??
    "H";

  const opcoesComuns = {
    errorCorrectionLevel:
      nivelCorrecao,

    margin:
      margemQr,

    width:
      larguraQr,

    color: {
      dark:
        "#000000",

      light:
        "#FFFFFF",
    },
  } as const;

  const bufferPng =
    await QRCode.toBuffer(
      qr.url,
      {
        ...opcoesComuns,

        type:
          "png",
      }
    );

  const conteudoSvg =
    await QRCode.toString(
      qr.url,
      {
        ...opcoesComuns,

        type:
          "svg",
      }
    );

  const base64Png =
    bufferPng.toString(
      "base64"
    );

  const bufferSvg =
    Buffer.from(
      conteudoSvg,
      "utf-8"
    );

  const base64Svg =
    bufferSvg.toString(
      "base64"
    );

  const agora =
    Date.now();

  return {
    qrId:
      qr.id,

    localId:
      qr.localId,

    localNome:
      qr.localNome,

    localSlug:
      qr.localSlug,

    template:
      tipoTemplate,

    urlDestino:
      qr.url,

    png: {
      formato:
        "png",

      mimeType:
        "image/png",

      buffer:
        bufferPng,

      base64:
        base64Png,

      dataUrl:
        `data:image/png;base64,${base64Png}`,

      tamanhoBytes:
        bufferPng.length,
    },

    svg: {
      formato:
        "svg",

      mimeType:
        "image/svg+xml",

      conteudo:
        conteudoSvg,

      base64:
        base64Svg,

      dataUrl:
        `data:image/svg+xml;base64,${base64Svg}`,

      tamanhoBytes:
        bufferSvg.length,
    },

    larguraQr,

    margemQr,

    criadoEm:
      agora,
  };
}