import "server-only";

import type {
  ImplantacaoContext,
} from "../ImplantacaoContext";

export type TipoQrGerado =
  | "principal";

export type QrLocalGerado = {
  id: string;

  localId: string;

  localNome: string;

  localSlug: string;

  tipoLocal: string;

  tipo: TipoQrGerado;

  url: string;

  valor: string;

  ativo: boolean;

  versao: number;

  criadoEm: number;

  atualizadoEm: number;
};

export type ResultadoGeradorQr = {
  contexto:
    ImplantacaoContext;

  qrPrincipal:
    QrLocalGerado;

  totalQrCodes: number;
};

function normalizarBaseUrl(
  baseUrl: string
): string {
  return baseUrl
    .trim()
    .replace(/\/+$/g, "");
}

function obterBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (
    baseUrl.startsWith(
      "http://"
    ) ||
    baseUrl.startsWith(
      "https://"
    )
  ) {
    return normalizarBaseUrl(
      baseUrl
    );
  }

  return normalizarBaseUrl(
    `https://${baseUrl}`
  );
}

function criarUrlPrincipal(
  contexto: ImplantacaoContext
): string {
  const baseUrl =
    obterBaseUrl();

  return (
    `${baseUrl}/acesso-v2/` +
    contexto.local.slug
  );
}

function adicionarQrAoContexto(
  contexto: ImplantacaoContext,
  qrId: string
): void {
  if (
    !contexto.qrcodes.gerados.includes(
      qrId
    )
  ) {
    contexto.qrcodes.gerados.push(
      qrId
    );
  }
}

export function gerarQr(
  contexto: ImplantacaoContext
): ResultadoGeradorQr {
  const agora =
    Date.now();

  const id =
    `${contexto.local.id}-qr-principal`;

  const url =
    criarUrlPrincipal(
      contexto
    );

  /*
   * O QR precisa codificar a URL direta.
   * Assim, a câmera do celular abre imediatamente
   * o acesso do visitante ao escanear a placa.
   */
  const valor =
    url;

  const qrPrincipal:
    QrLocalGerado = {
      id,

      localId:
        contexto.local.id,

      localNome:
        contexto.local.nome,

      localSlug:
        contexto.local.slug,

      tipoLocal:
        contexto.local.tipo,

      tipo:
        "principal",

      url,

      valor,

      ativo:
        true,

      versao:
        1,

      criadoEm:
        agora,

      atualizadoEm:
        agora,
    };

  adicionarQrAoContexto(
    contexto,
    qrPrincipal.id
  );

  contexto.estatisticas.totalQrCodes =
    1;

  contexto.resultado.mensagens.push(
    "1 QR Code principal preparado para o local."
  );

  return {
    contexto,

    qrPrincipal,

    totalQrCodes:
      1,
  };
}
