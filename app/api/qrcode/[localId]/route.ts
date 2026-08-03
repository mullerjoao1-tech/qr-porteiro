import "server-only";

import QRCode from "qrcode";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdmin,
} from "../../../services/server/firebaseAdmin";

type FormatoQr =
  | "png"
  | "svg";

type QrPrincipalBanco = {
  id?: string;

  localId?: string;

  localNome?: string;

  localSlug?: string;

  tipoLocal?: string;

  tipo?: string;

  url?: string;

  ativo?: boolean;

  versao?: number;

  criadoEm?: number;

  atualizadoEm?: number;
};

type LocalBanco = {
  id?: string;

  nome?: string;

  slug?: string;

  tipo?: string;

  tipoLocal?: string;

  status?: string;

  criadoEm?: number;

  atualizadoEm?: number;
};

function normalizarFormato(
  valor: string | null
): FormatoQr {
  return valor === "svg"
    ? "svg"
    : "png";
}

function normalizarNomeArquivo(
  valor: string
): string {
  const nome =
    valor
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
        "");

  return nome || "local";
}

function obterBaseUrl(
  request: NextRequest
): string {
  const configurada =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (configurada) {
    if (
      configurada.startsWith(
        "http://"
      ) ||
      configurada.startsWith(
        "https://"
      )
    ) {
      return configurada.replace(
        /\/+$/g,
        ""
      );
    }

    return `https://${configurada}`.replace(
      /\/+$/g,
      ""
    );
  }

  return request.nextUrl.origin.replace(
    /\/+$/g,
    ""
  );
}

async function resolverLocal(
  identificador: string
): Promise<{
  localId: string;
  local: LocalBanco;
} | null> {
  const {
    database,
  } = obterFirebaseAdmin();

  const snapshotDireto =
    await database
      .ref(
        `locais-v2/${identificador}`
      )
      .get();

  if (
    snapshotDireto.exists()
  ) {
    return {
      localId:
        identificador,

      local:
        snapshotDireto.val() as
          LocalBanco,
    };
  }

  const snapshotLocais =
    await database
      .ref(
        "locais-v2"
      )
      .get();

  if (
    !snapshotLocais.exists()
  ) {
    return null;
  }

  const locais =
    snapshotLocais.val() as
      Record<
        string,
        LocalBanco
      >;

  const encontrado =
    Object.entries(
      locais
    ).find(
      ([
        chave,
        local,
      ]) =>
        chave ===
          identificador ||
        local.id ===
          identificador ||
        local.slug ===
          identificador
    );

  if (!encontrado) {
    return null;
  }

  return {
    localId:
      encontrado[0],

    local:
      encontrado[1],
  };
}

async function buscarQrPrincipal(
  identificador: string,
  request: NextRequest
): Promise<QrPrincipalBanco | null> {
  const {
    database,
  } = obterFirebaseAdmin();

  const resolvido =
    await resolverLocal(
      identificador
    );

  if (!resolvido) {
    return null;
  }

  const {
    localId,
    local,
  } = resolvido;

  const snapshotQr =
    await database
      .ref(
        `qrcodes-v2/${localId}/principal`
      )
      .get();

  if (
    snapshotQr.exists()
  ) {
    return (
      snapshotQr.val() as
        QrPrincipalBanco
    );
  }

  const snapshotQrLocal =
    await database
      .ref(
        `locais-v2/${localId}/qrcode`
      )
      .get();

  if (
    snapshotQrLocal.exists()
  ) {
    const qrLocal =
      snapshotQrLocal.val() as
        QrPrincipalBanco;

    if (
      qrLocal.url?.trim()
    ) {
      return qrLocal;
    }
  }

  const slug =
    local.slug?.trim() ||
    local.id?.trim() ||
    identificador;

  const nome =
    local.nome?.trim() ||
    slug;

  const tipoLocal =
    local.tipoLocal?.trim() ||
    local.tipo?.trim() ||
    "local";

  const agora =
    Date.now();

  return {
    id:
      `${localId}-qr-principal`,

    localId,

    localNome:
      nome,

    localSlug:
      slug,

    tipoLocal,

    tipo:
      "principal",

    url:
      `${obterBaseUrl(request)}/acesso-v2/${slug}`,

    ativo:
      local.status !== "inativo",

    versao:
      1,

    criadoEm:
      local.criadoEm ||
      agora,

    atualizadoEm:
      agora,
  };
}

export async function GET(
  request: NextRequest,
  contexto: {
    params:
      Promise<{
        localId: string;
      }>;
  }
): Promise<Response> {
  try {
    const {
      localId: localIdRecebido,
    } = await contexto.params;

    const identificador =
      decodeURIComponent(
        localIdRecebido
      ).trim();

    if (!identificador) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "O local não foi informado.",
        },
        {
          status: 400,
        }
      );
    }

    const qr =
      await buscarQrPrincipal(
        identificador,
        request
      );

    if (!qr) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "Local não encontrado para gerar o QR principal.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      qr.ativo === false
    ) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "O QR principal deste local está inativo.",
        },
        {
          status: 410,
        }
      );
    }

    const urlDestino =
      qr.url?.trim();

    if (!urlDestino) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "A URL de destino do QR não foi encontrada.",
        },
        {
          status: 422,
        }
      );
    }

    const formato =
      normalizarFormato(
        request.nextUrl
          .searchParams
          .get("formato")
      );

    const baixar =
      request.nextUrl
        .searchParams
        .get("download") ===
      "1";

    const larguraRecebida =
      Number(
        request.nextUrl
          .searchParams
          .get("largura")
      );

    const largura =
      Number.isFinite(
        larguraRecebida
      )
        ? Math.min(
            Math.max(
              Math.floor(
                larguraRecebida
              ),
              256
            ),
            2048
          )
        : 900;

    const nomeBase =
      normalizarNomeArquivo(
        qr.localSlug ||
          qr.localNome ||
          identificador
      );

    const nomeArquivo =
      `qr-${nomeBase}.${formato}`;

    const cabecalhosBase:
      Record<string, string> = {
      "Cache-Control":
        "no-store",

      "Content-Disposition":
        `${
          baixar
            ? "attachment"
            : "inline"
        }; filename="${nomeArquivo}"`,

      "X-QR-Local-Id":
        qr.localId ||
        identificador,

      "X-QR-Destino":
        urlDestino,
    };

    if (
      formato === "svg"
    ) {
      const svg =
        await QRCode.toString(
          urlDestino,
          {
            type:
              "svg",

            errorCorrectionLevel:
              "H",

            margin:
              4,

            width:
              largura,

            color: {
              dark:
                "#000000",

              light:
                "#FFFFFF",
            },
          }
        );

      return new Response(
        svg,
        {
          status: 200,

          headers: {
            ...cabecalhosBase,

            "Content-Type":
              "image/svg+xml; charset=utf-8",
          },
        }
      );
    }

    const png =
      await QRCode.toBuffer(
        urlDestino,
        {
          type:
            "png",

          errorCorrectionLevel:
            "H",

          margin:
            4,

          width:
            largura,

          color: {
            dark:
              "#000000",

            light:
              "#FFFFFF",
          },
        }
      );

    return new Response(
      new Uint8Array(
        png
      ),
      {
        status: 200,

        headers: {
          ...cabecalhosBase,

          "Content-Type":
            "image/png",

          "Content-Length":
            String(
              png.length
            ),
        },
      }
    );
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível gerar o QR Code.";

    console.error(
      "Erro ao gerar QR dinâmico:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,

        mensagem,
      },
      {
        status: 500,
      }
    );
  }
}
