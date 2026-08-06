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

const CAMINHO_PLACA_PADRAO = join(
  process.cwd(),
  "public",
  "materiais",
  "condominio",
  "placa-condominio-padrao.png"
);

function obterNomeDestaque(
  nomeRecebido: string
): string {
  return nomeRecebido
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toUpperCase();
}

function normalizarBytesImagem(
  entrada: unknown
): Uint8Array {
  if (
    entrada instanceof
      Uint8Array
  ) {
    return entrada;
  }

  if (
    entrada instanceof
      ArrayBuffer
  ) {
    return new Uint8Array(
      entrada
    );
  }

  if (
    typeof entrada ===
      "string"
  ) {
    const valor =
      entrada.trim();

    const indiceBase64 =
      valor.indexOf(
        "base64,"
      );

    const base64 =
      indiceBase64 >= 0
        ? valor.slice(
            indiceBase64 +
              "base64,".length
          )
        : valor;

    return new Uint8Array(
      Buffer.from(
        base64,
        "base64"
      )
    );
  }

  throw new Error(
    "Formato de imagem não reconhecido."
  );
}

function imagemEhPng(
  bytes: Uint8Array
): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function imagemEhJpeg(
  bytes: Uint8Array
): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

const template: TemplateMaterial = {
  async gerar(
    dados: DadosMaterial
  ): Promise<ResultadoMaterial> {
    return criarMaterialPdf({
      dados,

      tamanho:
        "30x20-paisagem",

      nomeArquivo:
        `placa-condominio-${dados.slug}`,

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
          normalizarBytesImagem(
            await readFile(
              CAMINHO_PLACA_PADRAO
            )
          );

        const placa =
          imagemEhPng(
            bytesPlaca
          )
            ? await pdf.embedPng(
                bytesPlaca
              )
            : imagemEhJpeg(
                  bytesPlaca
                )
              ? await pdf.embedJpg(
                  bytesPlaca
                )
              : (() => {
                  throw new Error(
                    "A arte-base do condomínio não é um arquivo PNG ou JPEG válido."
                  );
                })();

        const larguraPagina =
          configuracao.largura;

        const alturaPagina =
          configuracao.altura;

        /*
         * Desenha a arte-base.
         */
        pagina.drawImage(
          placa,
          {
            x:
              0,

            y:
              0,

            width:
              larguraPagina,

            height:
              alturaPagina,
          }
        );

        /*
         * ==========================
         * ÁREA DO QR
         * CONFIGURAÇÃO APROVADA
         * ==========================
         */

        const areaQr = {
          tamanho:
            larguraPagina *
            0.145,

          x:
            larguraPagina *
            0.035,

          y:
            alturaPagina *
            0.390,
        };

        const bytesQr =
          normalizarBytesImagem(
            qrPng
          );

        const imagemQr =
          imagemEhPng(
            bytesQr
          )
            ? await pdf.embedPng(
                bytesQr
              )
            : imagemEhJpeg(
                  bytesQr
                )
              ? await pdf.embedJpg(
                  bytesQr
                )
              : (() => {
                  throw new Error(
                    "O QR Code gerado não é um arquivo PNG ou JPEG válido."
                  );
                })();

        pagina.drawImage(
          imagemQr,
          {
            x:
              areaQr.x,

            y:
              areaQr.y,

            width:
              areaQr.tamanho,

            height:
              areaQr.tamanho,
          }
        );

        /*
         * ==========================
         * ÁREA DO NOME
         * ==========================
         */

        const areaNome = {
          x:
            larguraPagina *
            0.255,

          y:
            alturaPagina *
            0.709,

          largura:
            larguraPagina *
            0.475,

          altura:
            alturaPagina *
            0.082,
        };

        const nome =
          obterNomeDestaque(
            dadosMaterial.nome
          );

        /*
         * Procura automaticamente o maior tamanho
         * de fonte que cabe dentro da moldura.
         */
        const tamanhoMaximo =
          32;

        const tamanhoMinimo =
          12;

        const passoReducao =
          0.2;

        const margemHorizontal =
          larguraPagina *
          0.012;

        const larguraDisponivel =
          areaNome.largura -
          margemHorizontal *
          2;

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
            passoReducao;

          larguraNome =
            fontes.negrito
              .widthOfTextAtSize(
                nome,
                tamanhoNome
              );
        }

        /*
         * Proteção para impedir valor quebrado
         * por arredondamento de ponto flutuante.
         */
        tamanhoNome =
          Math.max(
            tamanhoMinimo,
            Number(
              tamanhoNome.toFixed(
                2
              )
            )
          );

        larguraNome =
          fontes.negrito
            .widthOfTextAtSize(
              nome,
              tamanhoNome
            );

        /*
         * Centralização horizontal automática.
         */
        const xNome =
          areaNome.x +
          (
            areaNome.largura -
            larguraNome
          ) / 2;

        /*
         * Centralização vertical aprovada.
         */
        const yNome =
          areaNome.y +
          (
            areaNome.altura -
            tamanhoNome
          ) / 1.5 -
          1;

        const corNome =
          rgb(
            0.00,
            0.42,
            0.18
          );

        /*
         * Camadas para efeito Extra Bold.
         */
        const deslocamentos = [
          {
            x:
              0,

            y:
              0,
          },

          {
            x:
              0.18,

            y:
              0,
          },

          {
            x:
              -0.18,

            y:
              0,
          },

          {
            x:
              0,

            y:
              0.15,
          },
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
      },
    });
  },
};

export default template;
