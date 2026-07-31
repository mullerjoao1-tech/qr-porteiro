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

function obterBaseUrl(): string | null {
  const configurada =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (!configurada) {
    return null;
  }

  if (
    configurada.startsWith(
      "http://"
    ) ||
    configurada.startsWith(
      "https://"
    )
  ) {
    return configurada.replace(
      /\/+$/g,
      ""
    );
  }

  return `https://${configurada}`.replace(
    /\/+$/g,
    ""
  );
}

async function carregarPlacaPadrao(): Promise<Uint8Array> {
  const baseUrl =
    obterBaseUrl();

  if (baseUrl) {
    const resposta =
      await fetch(
        `${baseUrl}/materiais/placa-residencia-padrao.jpg`,
        {
          cache:
            "no-store",
        }
      );

    if (
      resposta.ok
    ) {
      return new Uint8Array(
        await resposta.arrayBuffer()
      );
    }
  }

  const caminhoLocal =
    join(
      process.cwd(),
      "public",
      "materiais",
      "placa-residencia-padrao.jpg"
    );

  const bytes =
    await readFile(
      caminhoLocal
    );

  return new Uint8Array(
    bytes
  );
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
          contexto
        ) {
          const {
            pagina,
            configuracao,
            pdf,
            qrPng,
            cores,
          } = contexto;

          const bytesPlaca =
            await carregarPlacaPadrao();

          const imagemPlaca =
            await pdf.embedJpg(
              bytesPlaca
            );

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

          pagina.drawRectangle({
            x:
              xQr - 4,

            y:
              yQr - 4,

            width:
              larguraQr + 8,

            height:
              alturaQr + 8,

            color:
              cores.branco,
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
