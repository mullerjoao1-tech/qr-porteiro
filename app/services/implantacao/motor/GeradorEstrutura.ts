import "server-only";

import type {
  EstruturaPaiGerada,
  EstruturaUnidadesGerada,
  TipoEstruturaUnidade,
  TipoUnidade,
  UnidadeGerada,
} from "../types";

export type ConfiguracaoGeradorEstrutura = {
  tipoEstrutura: TipoEstruturaUnidade;

  localId: string;
  localNome: string;
  localSlug: string;

  nomePai: string;
  tipoPai:
    | "bloco"
    | "andar"
    | "setor"
    | "ala"
    | "ambiente"
    | "outro";

  nomeFilho: string;
  tipoFilho: TipoUnidade;

  quantidadePais: number;
  quantidadeFilhos: number;

  criadoEm: number;
};

function preencher(
  numero: number,
  tamanho = 2
): string {
  return String(numero).padStart(
    tamanho,
    "0"
  );
}

export function gerarEstrutura(
  configuracao: ConfiguracaoGeradorEstrutura
): EstruturaUnidadesGerada {
  const estruturasPai: EstruturaPaiGerada[] =
    [];

  const unidades: UnidadeGerada[] =
    [];

  for (
    let pai = 1;
    pai <=
    configuracao.quantidadePais;
    pai++
  ) {
    const paiFormatado =
      preencher(pai);

    const paiId =
      `${configuracao.tipoPai}-${paiFormatado}`;

    estruturasPai.push({
      id: paiId,

      nome:
        `${configuracao.nomePai} ${pai}`,

      slug: paiId,

      tipo:
        configuracao.tipoPai,

      localId:
        configuracao.localId,

      localNome:
        configuracao.localNome,

      localSlug:
        configuracao.localSlug,

      status: "ativa",

      totalUnidades:
        configuracao.quantidadeFilhos,

      criadoEm:
        configuracao.criadoEm,

      atualizadoEm:
        configuracao.criadoEm,
    });

    for (
      let filho = 1;
      filho <=
      configuracao.quantidadeFilhos;
      filho++
    ) {
      const filhoFormatado =
        preencher(filho);

      const slug =
        `${paiId}-${configuracao.tipoFilho}-${filhoFormatado}`;

      unidades.push({
        id:
          `${configuracao.localId}-${slug}`,

        nome:
          `${configuracao.nomePai} ${pai} • ${configuracao.nomeFilho} ${filhoFormatado}`,

        slug,

        tipo:
          configuracao.tipoFilho,

        numero:
          filhoFormatado,

        codigo:
          `${paiFormatado}${filhoFormatado}`,

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

        moradores: {},

        usuarios: {},

        configuracao: {},

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