import "server-only";

import {
  randomUUID,
} from "node:crypto";

import type {
  Storage,
} from "firebase-admin/storage";

import type {
  ImagemQrGerada,
} from "./GeradorQrImagem";

export type ArquivoQrStorage = {
  formato:
    | "png"
    | "svg";

  caminho: string;

  bucket: string;

  mimeType: string;

  tamanhoBytes: number;

  tokenDownload: string;

  urlDownload: string;
};

export type ResultadoQrStorage = {
  localId: string;

  localSlug: string;

  qrId: string;

  pasta: string;

  png:
    ArquivoQrStorage;

  svg:
    ArquivoQrStorage;

  criadoEm: number;
};

function validarImagem(
  imagem: ImagemQrGerada
): void {
  if (
    !imagem.localId.trim()
  ) {
    throw new Error(
      "O ID do local não foi informado para salvar o QR."
    );
  }

  if (
    !imagem.localSlug.trim()
  ) {
    throw new Error(
      "O slug do local não foi informado para salvar o QR."
    );
  }

  if (
    !imagem.qrId.trim()
  ) {
    throw new Error(
      "O ID do QR não foi informado."
    );
  }

  if (
    imagem.png.buffer.length ===
    0
  ) {
    throw new Error(
      "A imagem PNG do QR está vazia."
    );
  }

  if (
    !imagem.svg.conteudo.trim()
  ) {
    throw new Error(
      "A imagem SVG do QR está vazia."
    );
  }
}

function normalizarParteCaminho(
  valor: string
): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
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
    );
}

function criarUrlDownload(
  bucketNome: string,
  caminho: string,
  token: string
): string {
  const caminhoCodificado =
    encodeURIComponent(
      caminho
    );

  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    `${bucketNome}/o/${caminhoCodificado}` +
    `?alt=media&token=${token}`
  );
}

async function salvarArquivo(
  parametros: {
    storage: Storage;

    caminho: string;

    conteudo:
      Buffer | string;

    mimeType: string;

    tamanhoBytes: number;

    formato:
      | "png"
      | "svg";
  }
): Promise<ArquivoQrStorage> {
  const bucket =
    parametros.storage.bucket();

  const arquivo =
    bucket.file(
      parametros.caminho
    );

  const tokenDownload =
    randomUUID();

  await arquivo.save(
    parametros.conteudo,
    {
      resumable: false,

      validation:
        "crc32c",

      metadata: {
        contentType:
          parametros.mimeType,

        cacheControl:
          "public,max-age=31536000,immutable",

        metadata: {
          firebaseStorageDownloadTokens:
            tokenDownload,

          origem:
            "qr-core",

          tipoArquivo:
            `qr-${parametros.formato}`,
        },
      },
    }
  );

  return {
    formato:
      parametros.formato,

    caminho:
      parametros.caminho,

    bucket:
      bucket.name,

    mimeType:
      parametros.mimeType,

    tamanhoBytes:
      parametros.tamanhoBytes,

    tokenDownload,

    urlDownload:
      criarUrlDownload(
        bucket.name,
        parametros.caminho,
        tokenDownload
      ),
  };
}

export async function salvarQrNoStorage(
  storage: Storage,
  imagem: ImagemQrGerada
): Promise<ResultadoQrStorage> {
  validarImagem(
    imagem
  );

  const localId =
    normalizarParteCaminho(
      imagem.localId
    );

  const qrId =
    normalizarParteCaminho(
      imagem.qrId
    );

  if (
    !localId ||
    !qrId
  ) {
    throw new Error(
      "Não foi possível gerar um caminho válido para o QR no Storage."
    );
  }

  const pasta =
    `qrcodes/${localId}/principal`;

  const caminhoPng =
    `${pasta}/${qrId}.png`;

  const caminhoSvg =
    `${pasta}/${qrId}.svg`;

  const [
    png,
    svg,
  ] = await Promise.all([
    salvarArquivo({
      storage,

      caminho:
        caminhoPng,

      conteudo:
        imagem.png.buffer,

      mimeType:
        imagem.png.mimeType,

      tamanhoBytes:
        imagem.png.tamanhoBytes,

      formato:
        "png",
    }),

    salvarArquivo({
      storage,

      caminho:
        caminhoSvg,

      conteudo:
        imagem.svg.conteudo,

      mimeType:
        imagem.svg.mimeType,

      tamanhoBytes:
        imagem.svg.tamanhoBytes,

      formato:
        "svg",
    }),
  ]);

  return {
    localId:
      imagem.localId,

    localSlug:
      imagem.localSlug,

    qrId:
      imagem.qrId,

    pasta,

    png,

    svg,

    criadoEm:
      Date.now(),
  };
}

export async function removerQrDoStorage(
  storage: Storage,
  resultado:
    ResultadoQrStorage
): Promise<void> {
  const bucket =
    storage.bucket();

  await Promise.allSettled([
    bucket
      .file(
        resultado.png.caminho
      )
      .delete({
        ignoreNotFound: true,
      }),

    bucket
      .file(
        resultado.svg.caminho
      )
      .delete({
        ignoreNotFound: true,
      }),
  ]);
}
