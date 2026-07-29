import "server-only";

import {
  gerarEstruturaCondominio,
} from "./motor/GeradorEstruturaCondominio";

import type {
  EntradaGeradorEstrutura,
  EstruturaUnidadesGerada,
} from "./types";

export async function gerarEstruturaUnidades(
  entrada: EntradaGeradorEstrutura
): Promise<EstruturaUnidadesGerada> {
  switch (entrada.tipo) {
    case "condominio":
      return gerarEstruturaCondominio({
        local: entrada.local,
        configuracao:
          entrada.configuracao,
      });

    case "beauty":
      throw new Error(
        "Gerador Beauty ainda não implementado."
      );

    case "barbearia":
      throw new Error(
        "Gerador Barbearia ainda não implementado."
      );

    case "clinica":
      throw new Error(
        "Gerador Clínica ainda não implementado."
      );

    case "empresa":
      throw new Error(
        "Gerador Empresa ainda não implementado."
      );

    case "restaurante":
      throw new Error(
        "Gerador Restaurante ainda não implementado."
      );

    case "residencia":
      throw new Error(
        "Gerador Residência ainda não implementado."
      );

    case "outro":
      throw new Error(
        "Gerador genérico ainda não implementado."
      );

    default:
      throw new Error(
        "Tipo de estrutura não suportado."
      );
  }
}