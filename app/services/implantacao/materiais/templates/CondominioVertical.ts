import "server-only";

import {
  readFile,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  rgb,
} from "pdf-lib";

import type {
  DadosMaterial,
  ResultadoMaterial,
  TemplateMaterial,
} from "../MaterialTypes";

import {
  criarMaterialPdf,
} from "../MaterialBuilder";

const CAMINHO_PLACA_VERTICAL = join(
  process.cwd(),
  "public",
  "materiais",
  "condominio",
  "placa-condominio-vertical-padrao.png"
);

function obterNomeDestaque(
  nomeRecebido: string
): string {
  return nomeRecebido
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

const template: TemplateMaterial = {
  async gerar(
    dados: DadosMaterial
  ): Promise<ResultadoMaterial> {
    return criarMaterialPdf({
      dados,

      tamanho:
        "a4-retrato",

      nomeArquivo:
        `placa-condominio-vertical-${dados.slug}`,

      async desenhar(
        contexto,
        dadosMaterial
      ) {
        const {
          pagina,
          configuracao,
          fontes,
          pdf,
          qrPng,
        } = contexto;

        const bytesPlaca =
          await readFile(
            CAMINHO_PLACA_VERTICAL
          );

        const placa =
          await pdf.embedPng(
            bytesPlaca
          );

        const larguraPagina =
          configuracao.largura;

        const alturaPagina =
          configuracao.altura;

        pagina.drawImage(
          placa,
          {
            x: 0,
            y: 0,
            width:
              larguraPagina,
            height:
              alturaPagina,
          }
        );

        /*
         * NOME DO CONDOMINIO
         * Area vazia verde da arte vertical.
         */
        const areaNome = {
          x:
            larguraPagina *
            0.135,

          y:
            alturaPagina *
            0.657,

          largura:
            larguraPagina *
            0.730,

          altura:
            alturaPagina *
            0.045,
        };

        const nome =
          obterNomeDestaque(
            dadosMaterial.nome
          );

        const tamanhoMaximo =
          30;

        const tamanhoMinimo =
          12;

        const margemHorizontal =
          larguraPagina *
          0.018;

        const larguraDisponivel =
          areaNome.largura -
          margemHorizontal * 2;

        let tamanhoNome =
          tamanhoMaximo;

        let larguraNome =
          fontes.negrito
            .widthOfTextAtSize(
              nome,
              tamanhoNome
            );

        while (
          larguraNome >
            larguraDisponivel &&
          tamanhoNome >
            tamanhoMinimo
        ) {
          tamanhoNome -=
            0.2;

          larguraNome =
            fontes.negrito
              .widthOfTextAtSize(
                nome,
                tamanhoNome
              );
        }

        tamanhoNome =
          Math.max(
            tamanhoMinimo,
            Number(
              tamanhoNome.toFixed(2)
            )
          );

        larguraNome =
          fontes.negrito
            .widthOfTextAtSize(
              nome,
              tamanhoNome
            );

        const xNome =
          areaNome.x +
          (
            areaNome.largura -
            larguraNome
          ) / 2;

        const yNome =
          areaNome.y +
          (
            areaNome.altura -
            tamanhoNome
          ) / 2 +
          2;

        const corNome =
          rgb(
            0.00,
            0.42,
            0.18
          );

        const deslocamentos = [
          { x: 0, y: 0 },
          { x: 0.16, y: 0 },
          { x: -0.16, y: 0 },
          { x: 0, y: 0.14 },
        ];

        for (
          const deslocamento of
            deslocamentos
        ) {
          pagina.drawText(
            nome,
            {
              x:
                xNome +
                deslocamento.x,

              y:
                yNome +
                deslocamento.y,

              size:
                tamanhoNome,

              font:
                fontes.negrito,

              color:
                corNome,
            }
          );
        }

        /*
         * CONTATOS QR ACESSO
         * Informacoes exibidas abaixo dos quatro canais do rodape.
         */
        const contatosRodape = [
          {
            texto: "(41) 99982-1219",
            centroX: 0.177,
            tamanho: 7.1,
          },
          {
            texto: "/qracesso",
            centroX: 0.397,
          },
          {
            texto: "@qracesso",
            centroX: 0.625,
          },
          {
            texto: "qracesso@gmail.com",
            centroX: 0.840,
            xInicio: 0.815,
          },
        ];

        const tamanhoContato = 7.5;

        for (const contato of contatosRodape) {
          const larguraContato =
            fontes.normal.widthOfTextAtSize(
              contato.texto,
              contato.tamanho ?? tamanhoContato
            );

          pagina.drawText(
            contato.texto,
            {
              x:
                contato.xInicio !== undefined
                  ? larguraPagina * contato.xInicio
                  : larguraPagina *
                      contato.centroX -
                    larguraContato / 2,

              y:
                alturaPagina *
                0.044,

              size:
                contato.tamanho ?? tamanhoContato,

              font:
                fontes.normal,

              color:
                rgb(
                  0.01,
                  0.08,
                  0.20
                ),
            }
          );
        }

        /*
         * QR CODE
         * Quadrado vazio central da arte vertical.
         */
        const tamanhoQr =
          larguraPagina *
          0.230;

        const xQr =
          larguraPagina *
          0.086;

        const yQr =
          alturaPagina *
          0.400;

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