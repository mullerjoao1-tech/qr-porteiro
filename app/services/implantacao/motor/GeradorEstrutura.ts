import "server-only";

import type {
  EstruturaPaiGerada,
  EstruturaUnidadesGerada,
  TipoEstruturaUnidade,
  TipoUnidade,
  UnidadeGerada,
} from "../types";

export type ConfiguracaoGeradorEstrutura = {
  tipoEstrutura:
    TipoEstruturaUnidade;

  localId:
    string;

  localNome:
    string;

  localSlug:
    string;

  nomePai:
    string;

  tipoPai:
    | "bloco"
    | "andar"
    | "setor"
    | "ala"
    | "ambiente"
    | "outro";

  nomeFilho:
    string;

  tipoFilho:
    TipoUnidade;

  quantidadePais:
    number;

  quantidadeFilhos:
    number;

  /*
   * Lista opcional com a numeração real
   * das unidades.
   *
   * Exemplo:
   * 11, 12, 13, 14, 21, 22...
   */
  numerosFilhos?:
    Array<
      string | number
    >;

  /*
   * Prefixo utilizado no endereço da unidade.
   *
   * apartamento → ap
   * consultorio → consultorio
   * sala → sala
   */
  prefixoSlugFilho?:
    string;

  /*
   * Permite gerar:
   *
   * bloco-1
   *
   * em vez de:
   *
   * bloco-01
   */
  preencherNumeroPai?:
    boolean;

  criadoEm:
    number;
};

function preencher(
  numero:
    number,
  tamanho =
    2
): string {
  return String(
    numero
  ).padStart(
    tamanho,
    "0"
  );
}

function obterNumeroPai(
  numeroPai:
    number,
  preencherNumeroPai:
    boolean
): string {
  if (
    preencherNumeroPai
  ) {
    return preencher(
      numeroPai
    );
  }

  return String(
    numeroPai
  );
}

function obterNumerosFilhos(
  configuracao:
    ConfiguracaoGeradorEstrutura
): string[] {
  if (
    configuracao.numerosFilhos &&
    configuracao.numerosFilhos
      .length >
      0
  ) {
    return configuracao
      .numerosFilhos
      .map(
        (
          numero
        ) =>
          String(
            numero
          ).trim()
      )
      .filter(
        Boolean
      );
  }

  const numeros:
    string[] =
      [];

  for (
    let numero =
      1;
    numero <=
    configuracao.quantidadeFilhos;
    numero +=
      1
  ) {
    numeros.push(
      preencher(
        numero
      )
    );
  }

  return numeros;
}

export function gerarEstrutura(
  configuracao:
    ConfiguracaoGeradorEstrutura
): EstruturaUnidadesGerada {
  const estruturasPai:
    EstruturaPaiGerada[] =
      [];

  const unidades:
    UnidadeGerada[] =
      [];

  const numerosFilhos =
    obterNumerosFilhos(
      configuracao
    );

  const prefixoSlugFilho =
    configuracao
      .prefixoSlugFilho ||
    configuracao.tipoFilho;

  const preencherNumeroPai =
    configuracao
      .preencherNumeroPai ??
    true;

  for (
    let pai =
      1;
    pai <=
    configuracao.quantidadePais;
    pai +=
      1
  ) {
    const paiFormatado =
      obterNumeroPai(
        pai,
        preencherNumeroPai
      );

    const paiId =
      `${configuracao.tipoPai}-${paiFormatado}`;

    estruturasPai.push({
      id:
        paiId,

      nome:
        `${configuracao.nomePai} ${pai}`,

      slug:
        paiId,

      tipo:
        configuracao.tipoPai,

      localId:
        configuracao.localId,

      localNome:
        configuracao.localNome,

      localSlug:
        configuracao.localSlug,

      status:
        "ativa",

      totalUnidades:
        numerosFilhos.length,

      criadoEm:
        configuracao.criadoEm,

      atualizadoEm:
        configuracao.criadoEm,
    });

    for (
      const numeroFilho of
        numerosFilhos
    ) {
      const slug =
        `${paiId}-${prefixoSlugFilho}-${numeroFilho}`;

      /*
       * O ID no banco continua exclusivo por local.
       *
       * Exemplo:
       * residencial-tulipas-bloco-1-ap-11
       */
      const unidadeId =
        `${configuracao.localId}-${slug}`;

      unidades.push({
        id:
          unidadeId,

        nome:
          `${configuracao.nomePai} ${pai} • ${configuracao.nomeFilho} ${numeroFilho}`,

        /*
         * O slug preserva o endereço amigável:
         *
         * bloco-1-ap-11
         */
        slug,

        tipo:
          configuracao.tipoFilho,

        numero:
          numeroFilho,

        codigo:
          `${paiFormatado}${numeroFilho}`,

        localId:
          configuracao.localId,

        localNome:
          configuracao.localNome,

        localSlug:
          configuracao.localSlug,

        estruturaPaiId:
          paiId,

        estruturaPaiNome:
          `${configuracao.nomePai} ${pai}`,

        status:
          "ativa",

        moradores:
          {},

        usuarios:
          {},

        configuracao: {
          rotaMorador:
            `/morador-v2/${slug}`,
        },

        criadoEm:
          configuracao.criadoEm,

        atualizadoEm:
          configuracao.criadoEm,
      });
    }
  }

  return {
    tipoEstrutura:
      configuracao.tipoEstrutura,

    localId:
      configuracao.localId,

    estruturasPai,

    unidades,

    totalEstruturasPai:
      estruturasPai.length,

    totalUnidades:
      unidades.length,

    totalPorTipo: {
      [configuracao.tipoFilho]:
        unidades.length,
    },
  };
}