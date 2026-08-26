import "server-only";

import type {
  ImplantacaoContext,
} from "../ImplantacaoContext";

export type LinksUnidadeGerados = {
  unidadeId: string;

  acessoVisitante: string;

  painelMorador: string;

  painelLocal: string;
};

export type ResultadoGeradorLinks = {
  contexto: ImplantacaoContext;

  linksPorUnidade:
    LinksUnidadeGerados[];

  totalLinks: number;
};

function normalizarBaseUrl(
  baseUrl: string
): string {
  return baseUrl
    .trim()
    .replace(/\/+$/g, "");
}

function criarLink(
  baseUrl: string,
  caminho: string
): string {
  const base =
    normalizarBaseUrl(baseUrl);

  const caminhoNormalizado =
    caminho.startsWith("/")
      ? caminho
      : `/${caminho}`;

  return `${base}${caminhoNormalizado}`;
}

function adicionarLink(
  contexto: ImplantacaoContext,
  link: string
): void {
  if (
    !contexto.links.gerados.includes(
      link
    )
  ) {
    contexto.links.gerados.push(
      link
    );
  }
}

export function gerarLinks(
  contexto: ImplantacaoContext,
  baseUrl: string
): ResultadoGeradorLinks {
  if (!contexto.estrutura) {
    throw new Error(
      "A estrutura das unidades ainda não foi gerada."
    );
  }

  const baseUrlNormalizada =
    normalizarBaseUrl(baseUrl);

  if (!baseUrlNormalizada) {
    throw new Error(
      "A URL base do sistema não foi informada."
    );
  }

  const painelLocal =
    criarLink(
      baseUrlNormalizada,
      `/painel-v2/${contexto.local.slug}`
    );

  adicionarLink(
    contexto,
    painelLocal
  );

  const linksPorUnidade =
    contexto.estrutura.unidades.map(
      (unidade) => {
        const acessoVisitante =
          criarLink(
            baseUrlNormalizada,
            `/acesso-v2/${contexto.local.slug}`
          );

        const painelMorador =
          criarLink(
            baseUrlNormalizada,
            `/morador-v2/${unidade.id}`
          );

        adicionarLink(
          contexto,
          acessoVisitante
        );

        adicionarLink(
          contexto,
          painelMorador
        );

        return {
          unidadeId:
            unidade.id,

          acessoVisitante,

          painelMorador,

          painelLocal,
        };
      }
    );

  contexto.resultado.mensagens.push(
    `${contexto.links.gerados.length} link(s) gerado(s).`
  );

  return {
    contexto,

    linksPorUnidade,

    totalLinks:
      contexto.links.gerados.length,
  };
}