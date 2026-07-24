"use client";

import { ReactNode } from "react";

import { usePermissoes } from "@/app/hooks/usePermissoes";

type Props = {
  children: ReactNode;

  permissao?: string;

  perfil?: string;

  fallback?: ReactNode;
};

export default function Permissao({
  children,
  permissao,
  perfil,
  fallback = null,
}: Props) {
  const {
    podeAcessar,
    possuiPerfil,
  } = usePermissoes();

  if (permissao) {
    if (!podeAcessar(permissao)) {
      return <>{fallback}</>;
    }
  }

  if (perfil) {
    if (!possuiPerfil(perfil)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}