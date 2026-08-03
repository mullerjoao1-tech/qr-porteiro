import "server-only";

import {
  readFile,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import type {
  DadosMaterial,
  ResultadoMaterial,
  TemplateMaterial,
} from "../MaterialTypes";

import {
  centralizarTexto,
  criarMaterialPdf,
  limitarTexto,
} from "../MaterialBuilder";

const CAMINHO_PLACA_PADRAO =
  join(
    process.cwd(),
    "public",
    "materiais",
    "residencia",
    "placa-residencia-padrao.png"
  );

function obterNomeDestaque(
  nomeRecebido: string
): string {
  const nome =
    nomeRecebido
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  const encontrado =
    nome.match(
      /^residencial\s+(.+)$/i
    );

  return limitarTexto(
    encontrado?.[1]
      ? encontrado[1].toUpperCase()
      : nome.toUpperCase(),
    22
  );
}

function calcularTamanhoNome(
  nome: string
): number {
  if (
    nome.length <= 9
  ) {
    return 56;
  }

  if (
    nome.length <= 13
  ) {
    return 47;
  }

  if (
    nome.length <= 17
  ) {
    return 39;
  }

  return 32;
}

const template:
  TemplateMaterial = {
    async gerar(
      dados: DadosMaterial
    ): Promise<ResultadoMaterial> {
      return criarMaterialPdf({
        dados,

        tamanho:
          "a4-retrato",

        nomeArquivo:
          `placa-residencia-${dados.slug}`,

        async desenhar(
          contexto,
          dadosMaterial
        ) {
          const {
            pagina,
            configuracao,
            fontes,
            cores,
            pdf,
            qrPng,
          } = contexto;

          const bytesPlaca =
            await readFile(
              CAMINHO_PLACA_PADRAO
            );

          const placa =
            await pdf.embedPng(
              bytesPlaca
            );

          const larguraPagina =
            configuracao.largura;

          const alturaPagina =
            configuracao.altura;

          /*
           * Mantém a proporção original da arte e
           * encaixa a placa inteira dentro do A4.
           */
          const alturaPlaca =
            alturaPagina -
            8;

          const larguraPlaca =
            alturaPlaca *
            (
              placa.width /
              placa.height
            );

          const xPlaca =
            (
              larguraPagina -
              larguraPlaca
            ) / 2;

          const yPlaca =
            (
              alturaPagina -
              alturaPlaca
            ) / 2;

          pagina.drawImage(
            placa,
            {
              x:
                xPlaca,

              y:
                yPlaca,

              width:
                larguraPlaca,

              height:
                alturaPlaca,
            }
          );

          /*
           * O template já possui o espaço do nome limpo.
           * Aqui apenas escrevemos o nome real do local.
           */
          const nome =
            obterNomeDestaque(
              dadosMaterial.nome
            );

          const tamanhoNome =
            calcularTamanhoNome(
              nome
            );

          const larguraNome =
            fontes.negrito
              .widthOfTextAtSize(
                nome,
                tamanhoNome
              );

          pagina.drawText(
            nome,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  larguraNome
                ),

              y:
                yPlaca +
                alturaPlaca *
                  0.735,

              size:
                tamanhoNome,

              font:
                fontes.negrito,

              color:
                cores.primaria,
            }
          );

          /*
           * O template já possui a moldura do QR vazia.
           * Aqui colocamos apenas o QR verdadeiro,
           * preservando uma margem interna.
           */
          const tamanhoQr =
            larguraPlaca *
            0.455;

          const xQr =
            xPlaca +
            (
              larguraPlaca -
              tamanhoQr
            ) / 2;

          const yQr =
  yPlaca +
  alturaPlaca *
      0.263;

          const imagemQr =
            await pdf.embedPng(
              qrPng
            );

          pagina.drawImage(
            imagemQr,
            {
              x:
                xQr,

              y:
                yQr,

              width:
                tamanhoQr,

              height:
                tamanhoQr,
            }
          );
        },
      });
    },
  };

export default template;
