import "server-only";

import type {
  DadosMaterial,
  ResultadoMaterial,
  SegmentoMaterial,
} from "./MaterialTypes";

import ResidenciaA4 from "./templates/ResidenciaA4";
import CondominioA4 from "./templates/CondominioA4";

const templates: Record<
  SegmentoMaterial,
  {
    gerar(
      dados: DadosMaterial
    ): Promise<ResultadoMaterial>;
  }
> = {
  residencia: ResidenciaA4,

  condominio: CondominioA4,

  beauty: ResidenciaA4,

  barbearia: ResidenciaA4,

  clinica: ResidenciaA4,

  empresa: ResidenciaA4,

  pet: ResidenciaA4,

  restaurante: ResidenciaA4,
};

export async function gerarMaterialPdf(
  dados: DadosMaterial
): Promise<ResultadoMaterial> {
  const template =
    templates[
      dados.segmento
    ];

  if (!template) {
    throw new Error(
      `Não existe template para o segmento "${dados.segmento}".`
    );
  }

  return template.gerar(
    dados
  );
}

export async function gerarMaterialResidencia(
  dados: DadosMaterial
) {
  return ResidenciaA4.gerar(
    dados
  );
}

export async function gerarMaterialCondominio(
  dados: DadosMaterial
) {
  return CondominioA4.gerar(
    dados
  );
}