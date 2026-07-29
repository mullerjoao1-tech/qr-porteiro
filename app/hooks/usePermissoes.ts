"use client";

import { useMemo } from "react";

import { useAuth } from "@/app/context/AuthContext";

import {
  listarPermissoes,
  listarPermissoesDoVinculo,
  listarVinculosComPermissao,
  obterVinculosAtivos,
  podeAcessar,
  podeAcessarNoVinculo,
  possuiPerfil,
  possuiPerfilNoVinculo,
} from "@/app/services/permissoes";

export function usePermissoes() {
  const {
    usuario,
    vinculoSelecionadoId,
    vinculoSelecionado,
  } = useAuth();

  return useMemo(
    () => ({
      usuario,

      vinculoSelecionadoId,
      vinculoSelecionado,

      vinculos: obterVinculosAtivos(usuario),

      /**
       * Permissões do vínculo/local atualmente selecionado.
       */
      permissoes: vinculoSelecionadoId
        ? listarPermissoesDoVinculo(
            usuario,
            vinculoSelecionadoId
          )
        : [],

      /**
       * Verifica a permissão somente no vínculo selecionado.
       */
      podeAcessar: (permissao: string) => {
        if (!vinculoSelecionadoId) {
          return false;
        }

        return podeAcessarNoVinculo(
          usuario,
          vinculoSelecionadoId,
          permissao
        );
      },

      /**
       * Verifica um perfil somente no vínculo selecionado.
       */
      possuiPerfil: (perfil: string) => {
        if (!vinculoSelecionadoId) {
          return false;
        }

        return possuiPerfilNoVinculo(
          usuario,
          vinculoSelecionadoId,
          perfil
        );
      },

      podeAcessarNoVinculo: (
        vinculoId: string,
        permissao: string
      ) =>
        podeAcessarNoVinculo(
          usuario,
          vinculoId,
          permissao
        ),

      possuiPerfilNoVinculo: (
        vinculoId: string,
        perfil: string
      ) =>
        possuiPerfilNoVinculo(
          usuario,
          vinculoId,
          perfil
        ),

      /**
       * Consultas globais preservadas para telas administrativas.
       */
      permissoesGlobais: listarPermissoes(usuario),

      podeAcessarGlobalmente: (
        permissao: string
      ) =>
        podeAcessar(
          usuario,
          permissao
        ),

      possuiPerfilGlobalmente: (
        perfil: string
      ) =>
        possuiPerfil(
          usuario,
          perfil
        ),

      vinculosComPermissao: (
        permissao: string
      ) =>
        listarVinculosComPermissao(
          usuario,
          permissao
        ),
    }),
    [
      usuario,
      vinculoSelecionadoId,
      vinculoSelecionado,
    ]
  );
}
