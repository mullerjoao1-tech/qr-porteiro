import "server-only";

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

          const larguraPagina =
            configuracao.largura;

          const alturaPagina =
            configuracao.altura;

          pagina.drawRectangle({
            x: 0,

            y: 0,

            width:
              larguraPagina,

            height:
              alturaPagina,

            color:
              cores.fundo,
          });

          pagina.drawRectangle({
            x: 0,

            y: 0,

            width:
              larguraPagina,

            height:
              180,

            color:
              cores.primaria,
          });

          const marca =
            "QR ACESSO";

          pagina.drawText(
            marca,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.negrito
                    .widthOfTextAtSize(
                      marca,
                      17
                    )
                ),

              y:
                790,

              size:
                17,

              font:
                fontes.negrito,

              color:
                cores.secundaria,
            }
          );

          const titulo =
            "ACESSO DE VISITANTES";

          pagina.drawText(
            titulo,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.negrito
                    .widthOfTextAtSize(
                      titulo,
                      18
                    )
                ),

              y:
                745,

              size:
                18,

              font:
                fontes.negrito,

              color:
                cores.primaria,
            }
          );

          const nomeLocal =
            limitarTexto(
              dadosMaterial.nome
                .toUpperCase(),
              32
            );

          const tamanhoNome =
            nomeLocal.length >
            24
              ? 27
              : 36;

          pagina.drawText(
            nomeLocal,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.negrito
                    .widthOfTextAtSize(
                      nomeLocal,
                      tamanhoNome
                    )
                ),

              y:
                685,

              size:
                tamanhoNome,

              font:
                fontes.negrito,

              color:
                cores.primaria,
            }
          );

          const subtitulo =
            dadosMaterial.subtitulo?.trim() ||
            "Escaneie o QR Code para chamar a residência";

          pagina.drawText(
            subtitulo,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.normal
                    .widthOfTextAtSize(
                      subtitulo,
                      15
                    )
                ),

              y:
                645,

              size:
                15,

              font:
                fontes.normal,

              color:
                cores.cinza,
            }
          );

          const qrImagem =
            await pdf.embedPng(
              qrPng
            );

          const tamanhoQr =
            350;

          const xQr =
            (
              larguraPagina -
              tamanhoQr
            ) / 2;

          pagina.drawRectangle({
            x:
              xQr - 13,

            y:
              250,

            width:
              tamanhoQr + 26,

            height:
              tamanhoQr + 26,

            borderColor:
              cores.primaria,

            borderWidth:
              2,

            color:
              cores.branco,
          });

          pagina.drawImage(
            qrImagem,
            {
              x:
                xQr,

              y:
                263,

              width:
                tamanhoQr,

              height:
                tamanhoQr,
            }
          );

          const instrucao =
            "APONTE A CÂMERA PARA O QR CODE";

          pagina.drawText(
            instrucao,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.negrito
                    .widthOfTextAtSize(
                      instrucao,
                      16
                    )
                ),

              y:
                215,

              size:
                16,

              font:
                fontes.negrito,

              color:
                cores.primaria,
            }
          );

          const rodapePrincipal =
            "Sua segurança e praticidade na palma da mão";

          pagina.drawText(
            rodapePrincipal,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.negrito
                    .widthOfTextAtSize(
                      rodapePrincipal,
                      15
                    )
                ),

              y:
                125,

              size:
                15,

              font:
                fontes.negrito,

              color:
                cores.branco,
            }
          );

          pagina.drawText(
            dadosMaterial.urlQr,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.normal
                    .widthOfTextAtSize(
                      dadosMaterial
                        .urlQr,
                      9
                    )
                ),

              y:
                92,

              size:
                9,

              font:
                fontes.normal,

              color:
                cores.branco,
            }
          );

          const rodape =
            "QR ACESSO • CONECTA • SEGURANÇA • FACILIDADE";

          pagina.drawText(
            rodape,
            {
              x:
                centralizarTexto(
                  larguraPagina,
                  fontes.negrito
                    .widthOfTextAtSize(
                      rodape,
                      10
                    )
                ),

              y:
                50,

              size:
                10,

              font:
                fontes.negrito,

              color:
                cores.branco,
            }
          );
        },
      });
    },
  };

export default template;