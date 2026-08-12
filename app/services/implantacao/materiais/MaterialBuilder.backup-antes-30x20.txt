import "server-only";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
  type RGB,
} from "pdf-lib";

import QRCode from "qrcode";

import type {
  DadosMaterial,
  ResultadoMaterial,
} from "./MaterialTypes";

export type TamanhoPaginaMaterial =
  | "a4-retrato"
  | "a4-paisagem"
  | "a5-retrato"
  | "a5-paisagem";

export type ConfiguracaoPaginaMaterial = {
  tamanho:
    TamanhoPaginaMaterial;

  largura: number;

  altura: number;
};

export type FontesMaterial = {
  normal:
    PDFFont;

  negrito:
    PDFFont;
};

export type CoresMaterial = {
  primaria:
    RGB;

  secundaria:
    RGB;

  texto:
    RGB;

  fundo:
    RGB;

  branco:
    RGB;

  cinza:
    RGB;
};

export type ContextoMaterial = {
  pdf:
    PDFDocument;

  pagina:
    PDFPage;

  configuracao:
    ConfiguracaoPaginaMaterial;

  fontes:
    FontesMaterial;

  cores:
    CoresMaterial;

  qrPng:
    Uint8Array;
};

export type DesenhadorMaterial = (
  contexto:
    ContextoMaterial,
  dados:
    DadosMaterial
) => Promise<void> | void;

const TAMANHOS_PAGINA: Record<
  TamanhoPaginaMaterial,
  ConfiguracaoPaginaMaterial
> = {
  "a4-retrato": {
    tamanho:
      "a4-retrato",

    largura:
      595.28,

    altura:
      841.89,
  },

  "a4-paisagem": {
    tamanho:
      "a4-paisagem",

    largura:
      841.89,

    altura:
      595.28,
  },

  "a5-retrato": {
    tamanho:
      "a5-retrato",

    largura:
      419.53,

    altura:
      595.28,
  },

  "a5-paisagem": {
    tamanho:
      "a5-paisagem",

    largura:
      595.28,

    altura:
      419.53,
  },
};

function converterHexParaRgb(
  valor:
    string | undefined,
  fallback:
    [number, number, number]
): RGB {
  if (!valor) {
    return rgb(
      fallback[0],
      fallback[1],
      fallback[2]
    );
  }

  const normalizado =
    valor
      .trim()
      .replace(
        "#",
        ""
      );

  if (
    !/^[0-9a-fA-F]{6}$/.test(
      normalizado
    )
  ) {
    return rgb(
      fallback[0],
      fallback[1],
      fallback[2]
    );
  }

  const vermelho =
    Number.parseInt(
      normalizado.slice(
        0,
        2
      ),
      16
    ) / 255;

  const verde =
    Number.parseInt(
      normalizado.slice(
        2,
        4
      ),
      16
    ) / 255;

  const azul =
    Number.parseInt(
      normalizado.slice(
        4,
        6
      ),
      16
    ) / 255;

  return rgb(
    vermelho,
    verde,
    azul
  );
}

function criarCores(
  dados:
    DadosMaterial
): CoresMaterial {
  return {
    primaria:
      converterHexParaRgb(
        dados.corPrimaria,
        [
          0.03,
          0.1,
          0.22,
        ]
      ),

    secundaria:
      converterHexParaRgb(
        dados.corSecundaria,
        [
          0.06,
          0.36,
          0.78,
        ]
      ),

    texto:
      converterHexParaRgb(
        dados.corTexto,
        [
          0.05,
          0.09,
          0.16,
        ]
      ),

    fundo:
      rgb(
        0.97,
        0.98,
        1
      ),

    branco:
      rgb(
        1,
        1,
        1
      ),

    cinza:
      rgb(
        0.35,
        0.4,
        0.48
      ),
  };
}

function validarDadosMaterial(
  dados:
    DadosMaterial
): void {
  if (
    !dados.localId.trim()
  ) {
    throw new Error(
      "O ID do local não foi informado para gerar o material."
    );
  }

  if (
    !dados.nome.trim()
  ) {
    throw new Error(
      "O nome do local não foi informado para gerar o material."
    );
  }

  if (
    !dados.slug.trim()
  ) {
    throw new Error(
      "O slug do local não foi informado para gerar o material."
    );
  }

  if (
    !dados.urlQr.trim()
  ) {
    throw new Error(
      "A URL do QR não foi informada para gerar o material."
    );
  }
}

function normalizarNomeArquivo(
  valor:
    string
): string {
  return (
    valor
      .trim()
      .toLowerCase()
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-z0-9-_]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      ) ||
    "material"
  );
}

async function gerarQrPng(
  dados:
    DadosMaterial
): Promise<Uint8Array> {
  if (
    dados.qrBase64
  ) {
    const limpo =
      dados.qrBase64.replace(
        /^data:image\/png;base64,/,
        ""
      );

    return new Uint8Array(
      Buffer.from(
        limpo,
        "base64"
      )
    );
  }

  const buffer =
    await QRCode.toBuffer(
      dados.urlQr,
      {
        type:
          "png",

        errorCorrectionLevel:
          "H",

        margin:
          3,

        width:
          1200,

        color: {
          dark:
            "#000000",

          light:
            "#FFFFFF",
        },
      }
    );

  return new Uint8Array(
    buffer
  );
}

export function obterConfiguracaoPagina(
  tamanho:
    TamanhoPaginaMaterial
): ConfiguracaoPaginaMaterial {
  return {
    ...TAMANHOS_PAGINA[
      tamanho
    ],
  };
}

export function centralizarTexto(
  larguraPagina:
    number,
  larguraTexto:
    number
): number {
  return (
    larguraPagina -
    larguraTexto
  ) / 2;
}

export function limitarTexto(
  texto:
    string,
  limite:
    number
): string {
  const valor =
    texto.trim();

  if (
    valor.length <=
    limite
  ) {
    return valor;
  }

  return (
    valor.slice(
      0,
      Math.max(
        limite - 3,
        0
      )
    ) + "..."
  );
}

export async function criarMaterialPdf(
  parametros: {
    dados:
      DadosMaterial;

    tamanho:
      TamanhoPaginaMaterial;

    nomeArquivo:
      string;

    desenhar:
      DesenhadorMaterial;
  }
): Promise<ResultadoMaterial> {
  validarDadosMaterial(
    parametros.dados
  );

  const configuracao =
    obterConfiguracaoPagina(
      parametros.tamanho
    );

  const pdf =
    await PDFDocument.create();

  const pagina =
    pdf.addPage([
      configuracao.largura,
      configuracao.altura,
    ]);

  const fontes:
    FontesMaterial = {
      normal:
        await pdf.embedFont(
          StandardFonts.Helvetica
        ),

      negrito:
        await pdf.embedFont(
          StandardFonts.HelveticaBold
        ),
    };

  const qrPng =
    await gerarQrPng(
      parametros.dados
    );

  const contexto:
    ContextoMaterial = {
      pdf,

      pagina,

      configuracao,

      fontes,

      cores:
        criarCores(
          parametros.dados
        ),

      qrPng,
    };

  await parametros.desenhar(
    contexto,
    parametros.dados
  );

  const bytes =
    await pdf.save();

  return {
    nomeArquivo:
      `${normalizarNomeArquivo(
        parametros.nomeArquivo
      )}.pdf`,

    mimeType:
      "application/pdf",

    bytes:
      new Uint8Array(
        bytes
      ),
  };
}