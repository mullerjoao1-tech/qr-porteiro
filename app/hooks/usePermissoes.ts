"use client";

import { useMemo } from "react";

import { useAuth } from "@/app/context/AuthContext";

import {
  listarPermissoes,
  listarVinculosComPermissao,
  obterVinculosAtivos,
  podeAcessar,
  podeAcessarNoVinculo,
  possuiPerfil,
} from "@/app/services/permissoes";

export function usePermissoes() {
  const { usuario } = useAuth();

  return useMemo(
    () => ({
      usuario,

      vinculos: obterVinculosAtivos(usuario),

      permissoes: listarPermissoes(usuario),

      podeAcessar: (permissao: string) =>
        podeAcessar(usuario, permissao),

      podeAcessarNoVinculo: (
        vinculoId: string,
        permissao: string
      ) =>
        podeAcessarNoVinculo(
          usuario,
          vinculoId,
          permissao
        ),

      possuiPerfil: (perfil: string) =>
        possuiPerfil(usuario, perfil),

      vinculosComPermissao: (
        permissao: string
      ) =>
        listarVinculosComPermissao(
          usuario,
          permissao
        ),
    }),
    [usuario]
  );
}