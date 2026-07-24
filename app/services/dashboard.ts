import { MODULOS_DASHBOARD } from "@/app/config/dashboard";
import { podeAcessar } from "@/app/services/permissoes";
import type { Usuario } from "@/app/types/Usuario";

export function obterModulosDashboard(usuario: Usuario | null) {
  return MODULOS_DASHBOARD
    .filter((modulo) => {
      if (!modulo.ativo) {
        return false;
      }

      return podeAcessar(usuario, modulo.permissao);
    })
    .sort((a, b) => a.ordem - b.ordem);
}

export function obterModulo(id: string) {
  return MODULOS_DASHBOARD.find((m) => m.id === id);
}