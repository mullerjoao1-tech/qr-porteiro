"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useAuth,
} from "@/app/context/AuthContext";

type PerfilAtivoContextType = {
  perfisDisponiveis: string[];
  perfilAtivo: string | null;

  selecionarPerfil: (
    perfil: string
  ) => void;

  possuiPerfil: (
    perfil: string
  ) => boolean;
};

const PerfilAtivoContext =
  createContext<
    PerfilAtivoContextType | null
  >(null);

const PREFIXO_CHAVE =
  "qr-core:perfil-ativo";

function chavePerfil(
  uid: string,
  vinculoId: string
) {
  return `${PREFIXO_CHAVE}:${uid}:${vinculoId}`;
}

function nomePerfilNormalizado(
  valor: string
) {
  return valor
    .trim()
    .toLowerCase()
    .replace(
      /-/g,
      "_"
    );
}

export function PerfilAtivoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    usuario,
    vinculoSelecionadoId,
    vinculoSelecionado,
  } =
    useAuth();

  const [
    perfilAtivo,
    setPerfilAtivo,
  ] =
    useState<
      string | null
    >(null);

  const perfisDisponiveis =
    useMemo(() => {
      if (
        !vinculoSelecionado
      ) {
        return [];
      }

      const lista =
        Object.entries(
          vinculoSelecionado.perfis ??
            {}
        )
          .filter(
            ([
              ,
              ativo,
            ]) =>
              ativo === true
          )
          .map(
            ([
              perfil,
            ]) =>
              nomePerfilNormalizado(
                perfil
              )
          );

      const principal =
        vinculoSelecionado
          .perfilPrincipal
          ? nomePerfilNormalizado(
              vinculoSelecionado
                .perfilPrincipal
            )
          : "";

      if (
        principal &&
        !lista.includes(
          principal
        )
      ) {
        lista.unshift(
          principal
        );
      }

      return Array.from(
        new Set(
          lista
        )
      );
    }, [
      vinculoSelecionado,
    ]);

  useEffect(() => {
    if (
      !usuario ||
      !vinculoSelecionadoId ||
      !vinculoSelecionado
    ) {
      setPerfilAtivo(
        null
      );

      return;
    }

    const chave =
      chavePerfil(
        usuario.uid,
        vinculoSelecionadoId
      );

    const salvo =
      typeof window !==
      "undefined"
        ? window.localStorage
            .getItem(
              chave
            )
            ?.trim() ||
          ""
        : "";

    const salvoValido =
      salvo &&
      perfisDisponiveis.includes(
        salvo
      );

    if (
      salvoValido
    ) {
      setPerfilAtivo(
        salvo
      );

      return;
    }

    const principal =
      vinculoSelecionado
        .perfilPrincipal
        ? nomePerfilNormalizado(
            vinculoSelecionado
              .perfilPrincipal
          )
        : "";

    const inicial =
      principal &&
      perfisDisponiveis.includes(
        principal
      )
        ? principal
        : perfisDisponiveis[0] ||
          null;

    setPerfilAtivo(
      inicial
    );

    if (
      inicial &&
      typeof window !==
        "undefined"
    ) {
      window.localStorage.setItem(
        chave,
        inicial
      );
    }
  }, [
    usuario,
    vinculoSelecionadoId,
    vinculoSelecionado,
    perfisDisponiveis,
  ]);

  function selecionarPerfil(
    perfil: string
  ) {
    if (
      !usuario ||
      !vinculoSelecionadoId
    ) {
      return;
    }

    const normalizado =
      nomePerfilNormalizado(
        perfil
      );

    if (
      !perfisDisponiveis.includes(
        normalizado
      )
    ) {
      throw new Error(
        "Este perfil não está liberado neste vínculo."
      );
    }

    setPerfilAtivo(
      normalizado
    );

    if (
      typeof window !==
      "undefined"
    ) {
      window.localStorage.setItem(
        chavePerfil(
          usuario.uid,
          vinculoSelecionadoId
        ),
        normalizado
      );
    }
  }

  function possuiPerfil(
    perfil: string
  ) {
    return perfisDisponiveis.includes(
      nomePerfilNormalizado(
        perfil
      )
    );
  }

  const value =
    useMemo<
      PerfilAtivoContextType
    >(
      () => ({
        perfisDisponiveis,
        perfilAtivo,
        selecionarPerfil,
        possuiPerfil,
      }),
      [
        perfisDisponiveis,
        perfilAtivo,
      ]
    );

  return (
    <PerfilAtivoContext.Provider
      value={
        value
      }
    >
      {children}
    </PerfilAtivoContext.Provider>
  );
}

export function usePerfilAtivo() {
  const contexto =
    useContext(
      PerfilAtivoContext
    );

  if (!contexto) {
    throw new Error(
      "usePerfilAtivo deve ser usado dentro de PerfilAtivoProvider."
    );
  }

  return contexto;
}
