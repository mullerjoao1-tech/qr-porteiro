import "server-only";

import {
  gerarEstrutura,
} from "./GeradorEstrutura";

import type {
  ConfiguracaoCondominioGerador,
  DadosLocalGerador,
  EstruturaUnidadesGerada,
  UnidadeGerada,
} from "../types";

type EntradaGeradorCondominio = {
  local: DadosLocalGerador;

  configuracao:
    ConfiguracaoCondominioGerador;
};

function preencherNumero(
  numero: number,
  tamanho = 2
): string {
  return String(numero).padStart(
    tamanho,
    "0"
  );
}

function validarConfiguracao(
  configuracao:
    ConfiguracaoCondominioGerador
): void {
  const {
    tipoCondominio,
    quantidadeBlocos,
    apartamentosPorBloco,
    quantidadeCasas,
  } = configuracao;

  if (
    tipoCondominio !==
      "vertical" &&
    tipoCondominio !==
      "horizontal" &&
    tipoCondominio !==
      "misto"
  ) {
    throw new Error(
      "O tipo do condomínio é inválido."
    );
  }

  if (
    tipoCondominio ===
      "vertical" ||
    tipoCondominio ===
      "misto"
  ) {
    if (
      quantidadeBlocos <= 0
    ) {
      throw new Error(
        "A quantidade de blocos precisa ser maior que zero."
      );
    }

    if (
      apartamentosPorBloco <=
      0
    ) {
      throw new Error(
        "A quantidade de apartamentos por bloco precisa ser maior que zero."
      );
    }
  }

  if (
    tipoCondominio ===
      "horizontal" ||
    tipoCondominio ===
      "misto"
  ) {
    if (
      quantidadeCasas <= 0
    ) {
      throw new Error(
        "A quantidade de casas precisa ser maior que zero."
      );
    }
  }
}

function gerarCasas(
  local: DadosLocalGerador,
  quantidadeCasas: number
): UnidadeGerada[] {
  const casas: UnidadeGerada[] =
    [];

  for (
    let numeroCasa = 1;
    numeroCasa <=
    quantidadeCasas;
    numeroCasa += 1
  ) {
    const numeroFormatado =
      preencherNumero(
        numeroCasa
      );

    const slug =
      `casa-${numeroFormatado}`;

    casas.push({
      id:
        `${local.localId}-${slug}`,

      nome:
        `Casa ${numeroFormatado}`,

      slug,

      tipo:
        "casa",

      numero:
        numeroFormatado,

      codigo:
        `CASA-${numeroFormatado}`,

      localId:
        local.localId,

      localNome:
        local.localNome,

      localSlug:
        local.localSlug,

      status:
        "ativa",

      moradores: {},

      usuarios: {},

      configuracao: {},

      criadoEm:
        local.criadoEm,

      atualizadoEm:
        local.criadoEm,
    });
  }

  return casas;
}

function gerarEstruturaVertical(
  local: DadosLocalGerador,
  configuracao:
    ConfiguracaoCondominioGerador
): EstruturaUnidadesGerada {
  return gerarEstrutura({
    tipoEstrutura:
      "condominio",

    localId:
      local.localId,

    localNome:
      local.localNome,

    localSlug:
      local.localSlug,

    nomePai:
      "Bloco",

    tipoPai:
      "bloco",

    nomeFilho:
      "Apartamento",

    tipoFilho:
      "apartamento",

    quantidadePais:
      configuracao.quantidadeBlocos,

    quantidadeFilhos:
      configuracao
        .apartamentosPorBloco,

    criadoEm:
      local.criadoEm,
  });
}

export function gerarEstruturaCondominio({
  local,
  configuracao,
}: EntradaGeradorCondominio): EstruturaUnidadesGerada {
  validarConfiguracao(
    configuracao
  );

  if (
    configuracao.tipoCondominio ===
    "vertical"
  ) {
    return gerarEstruturaVertical(
      local,
      configuracao
    );
  }

  if (
    configuracao.tipoCondominio ===
    "horizontal"
  ) {
    const casas =
      gerarCasas(
        local,
        configuracao.quantidadeCasas
      );

    return {
      tipoEstrutura:
        "condominio",

      localId:
        local.localId,

      estruturasPai: [],

      unidades:
        casas,

      totalEstruturasPai:
        0,

      totalUnidades:
        casas.length,

      totalPorTipo: {
        casa:
          casas.length,
      },
    };
  }

  const estruturaVertical =
    gerarEstruturaVertical(
      local,
      configuracao
    );

  const casas =
    gerarCasas(
      local,
      configuracao.quantidadeCasas
    );

  return {
    tipoEstrutura:
      "condominio",

    localId:
      local.localId,

    estruturasPai:
      estruturaVertical
        .estruturasPai,

    unidades: [
      ...estruturaVertical.unidades,
      ...casas,
    ],

    totalEstruturasPai:
      estruturaVertical
        .estruturasPai.length,

    totalUnidades:
      estruturaVertical
        .unidades.length +
      casas.length,

    totalPorTipo: {
      apartamento:
        estruturaVertical
          .unidades.length,

      casa:
        casas.length,
    },
  };
}