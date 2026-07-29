import "server-only";

import ResidenciaA4 from "./ResidenciaA4";

import type {
  DadosMaterial,
  ResultadoMaterial,
  TemplateMaterial,
} from "../MaterialTypes";

const template: TemplateMaterial = {
  async gerar(
    dados: DadosMaterial
  ): Promise<ResultadoMaterial> {
    return ResidenciaA4.gerar({
      ...dados,

      subtitulo:
        dados.subtitulo ||
        "Escaneie o QR Code para chamar a portaria.",

      corPrimaria:
        dados.corPrimaria ||
        "#081C3A",

      corSecundaria:
        dados.corSecundaria ||
        "#0B74E5",
    });
  },
};

export default template;