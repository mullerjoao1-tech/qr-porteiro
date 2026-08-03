import "server-only";

import type {
  Database,
} from "firebase-admin/database";

export type TemaVisualLocal =
  | "clean"
  | "institucional"
  | "premium";

export type IdentidadeVisualLocal = {
  tema:
    TemaVisualLocal;

  corPrimaria:
    string;

  corSecundaria:
    string;

  corTexto:
    string;

  logoUrl:
    string;

  bannerUrl:
    string;
};

export type ModuloLocal = {
  ativo:
    boolean;

  implantadoEm:
    number | null;
};

export type ModulosLocal =
  Record<
    string,
    ModuloLocal
  >;

export type EstatisticasLocal = {
  totalUsuarios:
    number;

  totalUnidades:
    number;

  totalMoradores:
    number;

  totalFuncionarios:
    number;

  totalPrestadores:
    number;

  totalVisitantes:
    number;

  totalClientes:
    number;

  totalProfissionais:
    number;

  atualizadoEm:
    number;
};

export type DadosCriarLocalUniversal = {
  localId:
    string;

  nome:
    string;

  slug:
    string;

  tipo:
    string;

  cidade:
    string;

  estado:
    string;

  endereco:
    string;

  criadoPorUid:
    string;

  criadoEm:
    number;

  modulos:
    ModulosLocal;

  estatisticas:
    EstatisticasLocal;

  configuracaoSegmento:
    unknown;

  identidadeVisual:
    IdentidadeVisualLocal;
};

export type ResultadoCadastroLocal = {
  localId:
    string;

  criado:
    boolean;

  atualizado:
    boolean;

  identidadeVisual:
    IdentidadeVisualLocal;
};

type LocalExistenteBanco = {
  id?:
    string;

  nome?:
    string;

  slug?:
    string;

  tipo?:
    string;

  status?:
    string;

  modulos?:
    ModulosLocal;

  estatisticas?:
    EstatisticasLocal;

  identidadeVisual?:
    Partial<
      IdentidadeVisualLocal
    >;
};

const TEMAS_VISUAIS =
  new Set<
    TemaVisualLocal
  >([
    "clean",
    "institucional",
    "premium",
  ]);

function normalizarHex(
  valor:
    unknown,
  fallback:
    string
): string {
  if (
    typeof valor !==
    "string"
  ) {
    return fallback;
  }

  const cor =
    valor
      .trim()
      .toUpperCase();

  if (
    /^#[0-9A-F]{6}$/.test(
      cor
    )
  ) {
    return cor;
  }

  return fallback;
}

export function normalizarIdentidadeVisual(
  valor:
    unknown
): IdentidadeVisualLocal {
  const dados =
    typeof valor ===
      "object" &&
    valor !== null &&
    !Array.isArray(
      valor
    )
      ? (
          valor as
            Record<
              string,
              unknown
            >
        )
      : {};

  const temaRecebido =
    typeof dados.tema ===
      "string"
      ? dados.tema
          .trim()
          .toLowerCase()
      : "";

  const tema =
    TEMAS_VISUAIS.has(
      temaRecebido as
        TemaVisualLocal
    )
      ? (
          temaRecebido as
            TemaVisualLocal
        )
      : "clean";

  return {
    tema,

    corPrimaria:
      normalizarHex(
        dados.corPrimaria,
        "#0F3D91"
      ),

    corSecundaria:
      normalizarHex(
        dados.corSecundaria,
        "#FFFFFF"
      ),

    corTexto:
      normalizarHex(
        dados.corTexto,
        "#111827"
      ),

    logoUrl:
      typeof dados.logoUrl ===
        "string"
        ? dados.logoUrl.trim()
        : "",

    bannerUrl:
      typeof dados.bannerUrl ===
        "string"
        ? dados.bannerUrl.trim()
        : "",
  };
}

function criarRegistroLocal(
  dados:
    DadosCriarLocalUniversal
) {
  return {
    id:
      dados.localId,

    nome:
      dados.nome,

    slug:
      dados.slug,

    tipo:
      dados.tipo,

    tipoLocal:
      dados.tipo,

    segmento:
      dados.tipo,

    status:
      "ativo",

    endereco:
      dados.endereco,

    cidade:
      dados.cidade,

    estado:
      dados.estado,

    modulos:
      dados.modulos,

    estatisticas:
      dados.estatisticas,

    identidadeVisual:
      dados.identidadeVisual,

    configuracao: {
      idioma:
        "pt-BR",

      fusoHorario:
        "America/Sao_Paulo",

      primeiroAcessoConcluido:
        false,

      segmento:
        dados.configuracaoSegmento,

      identidadeVisual:
        dados.identidadeVisual,
    },

    criadoEm:
      dados.criadoEm,

    atualizadoEm:
      dados.criadoEm,

    criadoPorUid:
      dados.criadoPorUid,

    origem:
      "cadastro-universal-qr-core",
  };
}

export async function criarOuAtualizarLocalUniversal(
  database:
    Database,
  dados:
    DadosCriarLocalUniversal
): Promise<ResultadoCadastroLocal> {
  const referencia =
    database.ref(
      `locais-v2/${dados.localId}`
    );

  const snapshot =
    await referencia.get();

  if (
    !snapshot.exists()
  ) {
    await referencia.set(
      criarRegistroLocal(
        dados
      )
    );

    return {
      localId:
        dados.localId,

      criado:
        true,

      atualizado:
        false,

      identidadeVisual:
        dados.identidadeVisual,
    };
  }

  const localAtual =
    snapshot.val() as
      LocalExistenteBanco;

  if (
    localAtual.slug &&
    localAtual.slug !==
      dados.slug
  ) {
    throw new Error(
      "Já existe um local com este ID, mas com slug diferente."
    );
  }

  if (
    localAtual.tipo &&
    localAtual.tipo !==
      dados.tipo
  ) {
    throw new Error(
      "Já existe um local com este ID, mas com tipo diferente."
    );
  }

  const identidadeVisual =
    normalizarIdentidadeVisual({
      ...localAtual.identidadeVisual,

      ...dados.identidadeVisual,
    });

  await referencia.update({
    nome:
      localAtual.nome ||
      dados.nome,

    slug:
      localAtual.slug ||
      dados.slug,

    tipo:
      localAtual.tipo ||
      dados.tipo,

    tipoLocal:
      localAtual.tipo ||
      dados.tipo,

    segmento:
      localAtual.tipo ||
      dados.tipo,

    status:
      "ativo",

    endereco:
      dados.endereco,

    cidade:
      dados.cidade,

    estado:
      dados.estado,

    modulos:
      localAtual.modulos ||
      dados.modulos,

    estatisticas:
      localAtual.estatisticas ||
      dados.estatisticas,

    identidadeVisual,

    "configuracao/segmento":
      dados.configuracaoSegmento,

    "configuracao/identidadeVisual":
      identidadeVisual,

    atualizadoEm:
      dados.criadoEm,
  });

  return {
    localId:
      dados.localId,

    criado:
      false,

    atualizado:
      true,

    identidadeVisual,
  };
}

export async function salvarIdentidadeVisualLocal(
  database:
    Database,
  localId:
    string,
  identidade:
    unknown
): Promise<IdentidadeVisualLocal> {
  const identidadeVisual =
    normalizarIdentidadeVisual(
      identidade
    );

  await database
    .ref(
      `locais-v2/${localId}`
    )
    .update({
      identidadeVisual,

      "configuracao/identidadeVisual":
        identidadeVisual,

      atualizadoEm:
        Date.now(),
    });

  return identidadeVisual;
}

export async function obterLocalUniversal(
  database:
    Database,
  localId:
    string
): Promise<
  Record<
    string,
    unknown
  > | null
> {
  const snapshot =
    await database
      .ref(
        `locais-v2/${localId}`
      )
      .get();

  if (
    !snapshot.exists()
  ) {
    return null;
  }

  return snapshot.val() as
    Record<
      string,
      unknown
    >;
}
