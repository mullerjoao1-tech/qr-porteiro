import { MODULOS_DASHBOARD } from "@/app/config/dashboard";

import {
  podeAcessar,
  podeAcessarNoVinculo,
} from "@/app/services/permissoes";

import type { Usuario } from "@/app/types/Usuario";

/**
 * Retorna os módulos liberados no vínculo/local selecionado.
 *
 * Quando vinculoId não for informado, mantém o comportamento
 * global anterior para preservar compatibilidade com telas antigas.
 */
export function obterModulosDashboard(
  usuario: Usuario | null,
  vinculoId?: string | null
) {
  return MODULOS_DASHBOARD
    .filter((modulo) => {
      if (!modulo.ativo) {
        return false;
      }

      if (vinculoId) {
        return podeAcessarNoVinculo(
          usuario,
          vinculoId,
          modulo.permissao
        );
      }

      return podeAcessar(
        usuario,
        modulo.permissao
      );
    })
    .sort(
      (a, b) =>
        a.ordem - b.ordem
    );
}

export function obterModulo(id: string) {
  return MODULOS_DASHBOARD.find(
    (modulo) =>
      modulo.id === id
  );
}
