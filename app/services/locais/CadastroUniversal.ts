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

  tipoLocal?:
    string;

  segmento?:
    string;

  status?:
    string;

  criadoEm?:
    number;

  criadoPorUid?:
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

function texto(
  valor:
    unknown
): string {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

export function normalizarSlugLocal(
  valor:
    string
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
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

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

function validarDadosLocal(
  dados:
    DadosCriarLocalUniversal
): {
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
} {
  const localId =
    texto(
      dados.localId
    );

  const nome =
    texto(
      dados.nome
    );

  const slugRecebido =
    texto(
      dados.slug
    );

  const slug =
    normalizarSlugLocal(
      slugRecebido
    );

  const tipo =
    texto(
      dados.tipo
    ).toLowerCase();

  const cidade =
    texto(
      dados.cidade
    );

  const estado =
    texto(
      dados.estado
    ).toUpperCase();

  const endereco =
    texto(
      dados.endereco
    );

  const criadoPorUid =
    texto(
      dados.criadoPorUid
    );

  if (!localId) {
    throw new Error(
      "LocalId não informado no Cadastro Universal."
    );
  }

  if (!nome) {
    throw new Error(
      "Nome do local não informado no Cadastro Universal."
    );
  }

  if (!slugRecebido) {
    throw new Error(
      "Slug do local não informado no Cadastro Universal."
    );
  }

  if (!slug) {
    throw new Error(
      "O slug informado não é válido."
    );
  }

  if (
    slug !==
    slugRecebido
  ) {
    throw new Error(
      `O slug deve estar padronizado. Use "${slug}".`
    );
  }

  if (!tipo) {
    throw new Error(
      "Tipo do local não informado no Cadastro Universal."
    );
  }

  if (!criadoPorUid) {
    throw new Error(
      "UID de quem criou o local não informado."
    );
  }

  if (
    !Number.isFinite(
      dados.criadoEm
    ) ||
    dados.criadoEm <= 0
  ) {
    throw new Error(
      "Data de criação inválida."
    );
  }

  return {
    localId,
    nome,
    slug,
    tipo,
    cidade,
    estado,
    endereco,
    criadoPorUid,
  };
}

async function validarSlugUnico(
  database:
    Database,
  localId:
    string,
  slug:
    string
): Promise<void> {
  const snapshot =
    await database
      .ref(
        "locais-v2"
      )
      .get();

  if (
    !snapshot.exists()
  ) {
    return;
  }

  const locais =
    snapshot.val() as
      Record<
        string,
        LocalExistenteBanco
      >;

  for (
    const [
      chave,
      local,
    ] of Object.entries(
      locais
    )
  ) {
    if (
      chave ===
      localId
    ) {
      continue;
    }

    const slugExistente =
      texto(
        local.slug
      );

    if (
      slugExistente ===
      slug
    ) {
      throw new Error(
        `O slug "${slug}" já está sendo usado por locais-v2/${chave}.`
      );
    }
  }
}

function mesclarModulos(
  atuais:
    ModulosLocal | undefined,
  recebidos:
    ModulosLocal
): ModulosLocal {
  return {
    ...(atuais ?? {}),
    ...recebidos,
  };
}

function mesclarEstatisticas(
  atuais:
    EstatisticasLocal | undefined,
  recebidas:
    EstatisticasLocal,
  atualizadoEm:
    number
): EstatisticasLocal {
  return {
    ...recebidas,
    ...(atuais ?? {}),
    atualizadoEm,
  };
}

function criarRegistroLocal(
  dados:
    DadosCriarLocalUniversal,
  normalizados:
    ReturnType<
      typeof validarDadosLocal
    >,
  identidadeVisual:
    IdentidadeVisualLocal
) {
  return {
    id:
      normalizados.localId,

    localId:
      normalizados.localId,

    nome:
      normalizados.nome,

    slug:
      normalizados.slug,

    tipo:
      normalizados.tipo,

    tipoLocal:
      normalizados.tipo,

    segmento:
      normalizados.tipo,

    status:
      "ativo",

    ativo:
      true,

    endereco:
      normalizados.endereco,

    cidade:
      normalizados.cidade,

    estado:
      normalizados.estado,

    modulos:
      dados.modulos,

    estatisticas:
      dados.estatisticas,

    identidadeVisual,

    configuracao: {
      idioma:
        "pt-BR",

      fusoHorario:
        "America/Sao_Paulo",

      primeiroAcessoConcluido:
        false,

      segmento:
        dados.configuracaoSegmento,

      identidadeVisual,
    },

    criadoEm:
      dados.criadoEm,

    atualizadoEm:
      dados.criadoEm,

    criadoPorUid:
      normalizados.criadoPorUid,

    origem:
      "cadastro-universal-qr-core",

    versaoEstrutura:
      2,
  };
}

export async function criarOuAtualizarLocalUniversal(
  database:
    Database,
  dados:
    DadosCriarLocalUniversal
): Promise<ResultadoCadastroLocal> {
  const normalizados =
    validarDadosLocal(
      dados
    );

  await validarSlugUnico(
    database,
    normalizados.localId,
    normalizados.slug
  );

  const referencia =
    database.ref(
      `locais-v2/${normalizados.localId}`
    );

  const snapshot =
    await referencia.get();

  const identidadeRecebida =
    normalizarIdentidadeVisual(
      dados.identidadeVisual
    );

  if (
    !snapshot.exists()
  ) {
    await referencia.set(
      criarRegistroLocal(
        dados,
        normalizados,
        identidadeRecebida
      )
    );

    return {
      localId:
        normalizados.localId,

      criado:
        true,

      atualizado:
        false,

      identidadeVisual:
        identidadeRecebida,
    };
  }

  const localAtual =
    snapshot.val() as
      LocalExistenteBanco;

  const idAtual =
    texto(
      localAtual.id
    );

  const slugAtual =
    texto(
      localAtual.slug
    );

  const tipoAtual =
    texto(
      localAtual.tipo ||
      localAtual.tipoLocal ||
      localAtual.segmento
    ).toLowerCase();

  if (
    idAtual &&
    idAtual !==
      normalizados.localId
  ) {
    throw new Error(
      "O campo id do local existente é diferente da chave usada em locais-v2."
    );
  }

  if (
    slugAtual &&
    slugAtual !==
      normalizados.slug
  ) {
    throw new Error(
      "Já existe um local com este ID, mas com slug diferente."
    );
  }

  if (
    tipoAtual &&
    tipoAtual !==
      normalizados.tipo
  ) {
    throw new Error(
      "Já existe um local com este ID, mas com tipo diferente."
    );
  }

  const identidadeVisual =
    normalizarIdentidadeVisual({
      ...localAtual.identidadeVisual,
      ...identidadeRecebida,
    });

  const modulos =
    mesclarModulos(
      localAtual.modulos,
      dados.modulos
    );

  const estatisticas =
    mesclarEstatisticas(
      localAtual.estatisticas,
      dados.estatisticas,
      dados.criadoEm
    );

  await referencia.update({
    id:
      normalizados.localId,

    localId:
      normalizados.localId,

    nome:
      normalizados.nome,

    slug:
      normalizados.slug,

    tipo:
      normalizados.tipo,

    tipoLocal:
      normalizados.tipo,

    segmento:
      normalizados.tipo,

    status:
      "ativo",

    ativo:
      true,

    endereco:
      normalizados.endereco,

    cidade:
      normalizados.cidade,

    estado:
      normalizados.estado,

    modulos,

    estatisticas,

    identidadeVisual,

    "configuracao/segmento":
      dados.configuracaoSegmento,

    "configuracao/identidadeVisual":
      identidadeVisual,

    atualizadoEm:
      dados.criadoEm,

    versaoEstrutura:
      2,
  });

  return {
    localId:
      normalizados.localId,

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
  const localIdNormalizado =
    texto(
      localId
    );

  if (
    !localIdNormalizado
  ) {
    throw new Error(
      "LocalId não informado para salvar a identidade visual."
    );
  }

  const referencia =
    database.ref(
      `locais-v2/${localIdNormalizado}`
    );

  const snapshot =
    await referencia.get();

  if (
    !snapshot.exists()
  ) {
    throw new Error(
      `O local "${localIdNormalizado}" não existe em locais-v2.`
    );
  }

  const identidadeVisual =
    normalizarIdentidadeVisual(
      identidade
    );

  await referencia.update({
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
  const localIdNormalizado =
    texto(
      localId
    );

  if (
    !localIdNormalizado
  ) {
    return null;
  }

  const snapshot =
    await database
      .ref(
        `locais-v2/${localIdNormalizado}`
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
