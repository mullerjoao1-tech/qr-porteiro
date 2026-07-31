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
  criarMaterialPdf,
} from "../MaterialBuilder";

const CAMINHO_PLACA_PADRAO =
  join(
    process.cwd(),
    "public",
    "materiais",
    "placa-residencia-padrao.png"
  );

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
          contexto
        ) {
          const {
            pagina,
            configuracao,
            pdf,
            qrPng,
          } = contexto;

          /*
           * Carrega a arte padrão aprovada da residência.
           * O arquivo deve existir em:
           * public/materiais/placa-residencia-padrao.png
           */
          const bytesPlaca =
            await readFile(
              CAMINHO_PLACA_PADRAO
            );

          const imagemPlaca =
            await pdf.embedPng(
              bytesPlaca
            );

          /*
           * Mantém a proporção original da placa e centraliza
           * dentro da página A4.
           */
          const larguraPagina =
            configuracao.largura;

          const alturaPagina =
            configuracao.altura;

          const proporcaoPlaca =
            imagemPlaca.width /
            imagemPlaca.height;

          const alturaPlaca =
            alturaPagina -
            10;

          const larguraPlaca =
            alturaPlaca *
            proporcaoPlaca;

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
            imagemPlaca,
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
           * Posição do espaço do QR dentro da arte padrão.
           * Os valores são proporcionais ao recorte da placa,
           * para continuar correto mesmo com redimensionamento.
           */
          const xQr =
            xPlaca +
            larguraPlaca *
              0.225;

          const yQr =
            yPlaca +
            alturaPlaca *
              0.292;

          const larguraQr =
            larguraPlaca *
            0.55;

          const alturaQr =
            alturaPlaca *
            0.342;

          /*
           * Apaga somente o QR de demonstração da arte,
           * preservando a moldura azul já aprovada.
           */
          pagina.drawRectangle({
            x:
              xQr - 3,

            y:
              yQr - 3,

            width:
              larguraQr + 6,

            height:
              alturaQr + 6,

            color:
              contexto.cores.branco,
          });

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
                larguraQr,

              height:
                alturaQr,
            }
          );
        },
      });
    },
  };

export default template;
