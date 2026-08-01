import "server-only";

import {
  degrees,
  rgb,
  type PDFPage,
  type RGB,
} from "pdf-lib";

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

function separarNomeLocal(
  nomeRecebido: string
): {
  cabecalho: string;
  destaque: string;
} {
  const nome =
    nomeRecebido
      .trim()
      .replace(/\s+/g, " ");

  const correspondencia =
    nome.match(/^residencial\s+(.+)$/i);

  if (correspondencia?.[1]) {
    return {
      cabecalho: "RESIDENCIAL",
      destaque:
        correspondencia[1].toUpperCase(),
    };
  }

  return {
    cabecalho: "RESIDÊNCIA",
    destaque: nome.toUpperCase(),
  };
}

function desenharCasa(
  pagina: PDFPage,
  x: number,
  y: number,
  escala: number,
  cor: RGB
): void {
  pagina.drawLine({
    start: { x, y },
    end: {
      x: x + 70 * escala,
      y: y + 58 * escala,
    },
    thickness: 9 * escala,
    color: cor,
  });

  pagina.drawLine({
    start: {
      x: x + 70 * escala,
      y: y + 58 * escala,
    },
    end: {
      x: x + 140 * escala,
      y,
    },
    thickness: 9 * escala,
    color: cor,
  });

  pagina.drawRectangle({
    x: x + 45 * escala,
    y,
    width: 50 * escala,
    height: 42 * escala,
    color: cor,
  });

  pagina.drawRectangle({
    x: x + 59 * escala,
    y: y + 10 * escala,
    width: 22 * escala,
    height: 27 * escala,
    color: rgb(1, 1, 1),
  });

  pagina.drawRectangle({
    x: x + 112 * escala,
    y: y + 34 * escala,
    width: 14 * escala,
    height: 35 * escala,
    color: cor,
  });
}

function desenharSino(
  pagina: PDFPage,
  x: number,
  y: number,
  escala: number,
  cor: RGB
): void {
  pagina.drawCircle({
    x,
    y,
    size: 33 * escala,
    borderColor: cor,
    borderWidth: 2.4 * escala,
  });

  pagina.drawLine({
    start: {
      x: x - 11 * escala,
      y: y - 6 * escala,
    },
    end: {
      x: x - 6 * escala,
      y: y + 13 * escala,
    },
    thickness: 2.2 * escala,
    color: cor,
  });

  pagina.drawLine({
    start: {
      x: x - 6 * escala,
      y: y + 13 * escala,
    },
    end: {
      x,
      y: y + 19 * escala,
    },
    thickness: 2.2 * escala,
    color: cor,
  });

  pagina.drawLine({
    start: {
      x,
      y: y + 19 * escala,
    },
    end: {
      x: x + 6 * escala,
      y: y + 13 * escala,
    },
    thickness: 2.2 * escala,
    color: cor,
  });

  pagina.drawLine({
    start: {
      x: x + 6 * escala,
      y: y + 13 * escala,
    },
    end: {
      x: x + 11 * escala,
      y: y - 6 * escala,
    },
    thickness: 2.2 * escala,
    color: cor,
  });

  pagina.drawLine({
    start: {
      x: x - 14 * escala,
      y: y - 7 * escala,
    },
    end: {
      x: x + 14 * escala,
      y: y - 7 * escala,
    },
    thickness: 2.2 * escala,
    color: cor,
  });

  pagina.drawCircle({
    x,
    y: y - 12 * escala,
    size: 2.4 * escala,
    color: cor,
  });
}

const template: TemplateMaterial = {
  async gerar(
    dados: DadosMaterial
  ): Promise<ResultadoMaterial> {
    return criarMaterialPdf({
      dados,
      tamanho: "a4-retrato",
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

        const larguraPagina =
          configuracao.largura;

        const alturaPagina =
          configuracao.altura;

        const margem = 32;
        const larguraPlaca =
          larguraPagina - margem * 2;
        const alturaPlaca =
          alturaPagina - margem * 2;
        const xPlaca = margem;
        const yPlaca = margem;

        const azulEscuro =
          cores.primaria;

        const azulDestaque =
          cores.secundaria;

        const branco =
          cores.branco;

        const cinzaClaro =
          rgb(0.96, 0.97, 0.99);

        pagina.drawRectangle({
          x: 0,
          y: 0,
          width: larguraPagina,
          height: alturaPagina,
          color: rgb(0.93, 0.95, 0.97),
        });

        pagina.drawRectangle({
          x: xPlaca,
          y: yPlaca,
          width: larguraPlaca,
          height: alturaPlaca,
          color: branco,
          borderColor:
            rgb(0.82, 0.85, 0.89),
          borderWidth: 1,
        });

        /*
         * Faixa inferior azul.
         * Esta versão evita drawSvgPath, que estava causando
         * erro em tempo de execução no pdf-lib.
         */
        pagina.drawRectangle({
          x: xPlaca,
          y: yPlaca,
          width: larguraPlaca,
          height: 252,
          color: azulEscuro,
        });

        /*
         * Faixa inclinada de transição para manter o visual
         * moderno da placa sem depender de curvas SVG.
         */
        pagina.drawRectangle({
          x: xPlaca,
          y: yPlaca + 222,
          width: larguraPlaca * 0.62,
          height: 52,
          color: rgb(0.02, 0.08, 0.18),
          rotate: degrees(-6),
        });

        pagina.drawRectangle({
          x: xPlaca + larguraPlaca * 0.52,
          y: yPlaca + 214,
          width: larguraPlaca * 0.5,
          height: 72,
          color: azulEscuro,
          rotate: degrees(8),
        });

        const {
          cabecalho,
          destaque,
        } = separarNomeLocal(
          dadosMaterial.nome
        );

        desenharCasa(
          pagina,
          larguraPagina / 2 - 57,
          728,
          0.82,
          azulEscuro
        );

        const tamanhoCabecalho = 18;

        pagina.drawText(
          cabecalho,
          {
            x:
              centralizarTexto(
                larguraPagina,
                fontes.negrito
                  .widthOfTextAtSize(
                    cabecalho,
                    tamanhoCabecalho
                  )
              ),
            y: 688,
            size: tamanhoCabecalho,
            font: fontes.negrito,
            color: azulEscuro,
          }
        );

        const destaqueLimitado =
          limitarTexto(
            destaque,
            24
          );

        const tamanhoDestaque =
          destaqueLimitado.length > 15
            ? 42
            : 54;

        pagina.drawText(
          destaqueLimitado,
          {
            x:
              centralizarTexto(
                larguraPagina,
                fontes.negrito
                  .widthOfTextAtSize(
                    destaqueLimitado,
                    tamanhoDestaque
                  )
              ),
            y: 625,
            size: tamanhoDestaque,
            font: fontes.negrito,
            color: azulEscuro,
          }
        );

        pagina.drawLine({
          start: { x: 168, y: 607 },
          end: { x: 276, y: 607 },
          thickness: 1.2,
          color: azulEscuro,
        });

        pagina.drawLine({
          start: { x: 319, y: 607 },
          end: { x: 427, y: 607 },
          thickness: 1.2,
          color: azulEscuro,
        });

        pagina.drawRectangle({
          x: larguraPagina / 2 - 5,
          y: 602,
          width: 10,
          height: 10,
          color: azulEscuro,
          rotate: degrees(45),
        });

        const textoAcesso =
          "Acesso de visitantes";

        pagina.drawText(
          textoAcesso,
          {
            x:
              centralizarTexto(
                larguraPagina,
                fontes.normal
                  .widthOfTextAtSize(
                    textoAcesso,
                    21
                  )
              ),
            y: 566,
            size: 21,
            font: fontes.normal,
            color: azulEscuro,
          }
        );

        const tamanhoCaixaQr = 316;
        const xCaixaQr =
          (larguraPagina -
            tamanhoCaixaQr) / 2;
        const yCaixaQr = 250;

        pagina.drawRectangle({
          x: xCaixaQr,
          y: yCaixaQr,
          width: tamanhoCaixaQr,
          height: tamanhoCaixaQr,
          color: branco,
          borderColor: azulEscuro,
          borderWidth: 3,
        });

        pagina.drawRectangle({
          x: xCaixaQr + 10,
          y: yCaixaQr + 10,
          width:
            tamanhoCaixaQr - 20,
          height:
            tamanhoCaixaQr - 20,
          color: cinzaClaro,
        });

        const imagemQr =
          await pdf.embedPng(
            qrPng
          );

        pagina.drawImage(
          imagemQr,
          {
            x: xCaixaQr + 18,
            y: yCaixaQr + 18,
            width:
              tamanhoCaixaQr - 36,
            height:
              tamanhoCaixaQr - 36,
          }
        );

        desenharSino(
          pagina,
          184,
          164,
          1,
          branco
        );

        pagina.drawText(
          "ESCANEIE O QR CODE",
          {
            x: 231,
            y: 174,
            size: 20,
            font: fontes.negrito,
            color: branco,
          }
        );

        pagina.drawText(
          "para chamar a residência",
          {
            x: 231,
            y: 148,
            size: 18,
            font: fontes.normal,
            color: branco,
          }
        );

        pagina.drawLine({
          start: { x: 205, y: 121 },
          end: { x: 275, y: 121 },
          thickness: 1.2,
          color: branco,
        });

        pagina.drawLine({
          start: { x: 320, y: 121 },
          end: { x: 390, y: 121 },
          thickness: 1.2,
          color: branco,
        });

        pagina.drawRectangle({
          x: larguraPagina / 2 - 4,
          y: 117,
          width: 8,
          height: 8,
          color: azulDestaque,
          rotate: degrees(45),
        });

        pagina.drawText(
          "QR",
          {
            x: 222,
            y: 82,
            size: 27,
            font: fontes.negrito,
            color: azulDestaque,
          }
        );

        pagina.drawText(
          "ACESSO",
          {
            x: 260,
            y: 84,
            size: 22,
            font: fontes.negrito,
            color: branco,
          }
        );

        const assinatura =
          "CONECTA • SEGURANÇA • FACILIDADE";

        pagina.drawText(
          assinatura,
          {
            x:
              centralizarTexto(
                larguraPagina,
                fontes.negrito
                  .widthOfTextAtSize(
                    assinatura,
                    8
                  )
              ),
            y: 61,
            size: 8,
            font: fontes.negrito,
            color: branco,
          }
        );
      },
    });
  },
};

export default template;
