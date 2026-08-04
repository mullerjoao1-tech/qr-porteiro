"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  entrarComEmailSenha,
  enviarRecuperacaoSenha,
  observarUsuarioAutenticado,
  sairDaConta,
} from "@/app/services/auth/auth";

import {
  buscarUsuarioPorUid,
  registrarUltimoLogin,
} from "@/app/services/usuarios";

import {
  obterVinculo,
  obterVinculosAtivos,
  type VinculoComPermissoes,
} from "@/app/services/permissoes";

import type {
  Usuario,
} from "@/app/types/Usuario";

type AuthContextType = {
  usuario:
    Usuario | null;

  carregando:
    boolean;

  vinculosAtivos:
    Array<
      [
        string,
        VinculoComPermissoes,
      ]
    >;

  /**
   * null = Carteira Geral.
   * string = local específico selecionado.
   */
  vinculoSelecionadoId:
    string | null;

  /**
   * null = Carteira Geral.
   */
  vinculoSelecionado:
    VinculoComPermissoes | null;

  selecionarVinculo:
    (
      vinculoId:
        string
    ) => void;

  selecionarCarteiraGeral:
    () => void;

  login:
    (
      email:
        string,
      senha:
        string
    ) => Promise<void>;

  logout:
    () => Promise<void>;

  recuperarSenha:
    (
      email:
        string
    ) => Promise<void>;

  atualizarUsuario:
    () => Promise<void>;
};

const AuthContext =
  createContext<
    AuthContextType | null
  >(
    null
  );

export function AuthProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const [
    usuario,
    setUsuario,
  ] =
    useState<
      Usuario | null
    >(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  const [
    vinculoSelecionadoId,
    setVinculoSelecionadoId,
  ] =
    useState<
      string | null
    >(
      null
    );

  function definirUsuario(
    usuarioBanco:
      Usuario | null
  ) {
    setUsuario(
      usuarioBanco
    );

    /*
     * Todo login começa na Carteira Geral.
     * A seleção do local deve ser explícita,
     * inclusive quando existe somente um vínculo.
     */
    setVinculoSelecionadoId(
      null
    );
  }

  useEffect(
    () => {
      const unsubscribe =
        observarUsuarioAutenticado(
          async (
            firebaseUser
          ) => {
            setCarregando(
              true
            );

            try {
              if (
                !firebaseUser
              ) {
                definirUsuario(
                  null
                );

                return;
              }

              const usuarioBanco =
                await buscarUsuarioPorUid(
                  firebaseUser.uid
                );

              definirUsuario(
                usuarioBanco
              );

              if (
                usuarioBanco
              ) {
                await registrarUltimoLogin(
                  firebaseUser.uid
                );
              }
            } catch (
              erro
            ) {
              console.error(
                "Erro ao carregar usuário autenticado:",
                erro
              );

              definirUsuario(
                null
              );
            } finally {
              setCarregando(
                false
              );
            }
          }
        );

      return unsubscribe;
    },
    []
  );

  const vinculosAtivos =
    useMemo(
      () =>
        obterVinculosAtivos(
          usuario
        ),
      [
        usuario,
      ]
    );

  const vinculoSelecionado =
    useMemo(
      () => {
        if (
          !usuario ||
          !vinculoSelecionadoId
        ) {
          return null;
        }

        const vinculo =
          obterVinculo(
            usuario,
            vinculoSelecionadoId
          );

        if (
          !vinculo ||
          vinculo.ativo ===
            false
        ) {
          return null;
        }

        return vinculo;
      },
      [
        usuario,
        vinculoSelecionadoId,
      ]
    );

  function selecionarVinculo(
    vinculoId:
      string
  ) {
    if (!usuario) {
      throw new Error(
        "Não existe usuário carregado."
      );
    }

    const vinculo =
      obterVinculo(
        usuario,
        vinculoId
      );

    if (
      !vinculo ||
      vinculo.ativo ===
        false
    ) {
      throw new Error(
        "Este vínculo não existe ou está inativo."
      );
    }

    setVinculoSelecionadoId(
      vinculoId
    );
  }

  function selecionarCarteiraGeral() {
    setVinculoSelecionadoId(
      null
    );
  }

  async function login(
    email:
      string,
    senha:
      string
  ) {
    setCarregando(
      true
    );

    try {
      const resultado =
        await entrarComEmailSenha(
          email,
          senha
        );

      if (
        !resultado.sucesso ||
        !resultado.usuario
      ) {
        throw new Error(
          resultado.erro ||
          "Usuário não autenticado."
        );
      }

      const usuarioBanco =
        await buscarUsuarioPorUid(
          resultado.usuario.uid
        );

      if (
        !usuarioBanco
      ) {
        await sairDaConta();

        definirUsuario(
          null
        );

        throw new Error(
          "Usuário autenticado, mas sem cadastro na plataforma."
        );
      }

      if (
        usuarioBanco.status !==
        "ativo"
      ) {
        await sairDaConta();

        definirUsuario(
          null
        );

        throw new Error(
          `O usuário está com status "${usuarioBanco.status}".`
        );
      }

      definirUsuario(
        usuarioBanco
      );

      await registrarUltimoLogin(
        resultado.usuario.uid
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  async function logout() {
    setCarregando(
      true
    );

    try {
      const resultado =
        await sairDaConta();

      if (
        !resultado.sucesso
      ) {
        throw new Error(
          resultado.erro ||
          "Não foi possível sair da conta."
        );
      }

      definirUsuario(
        null
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  async function recuperarSenha(
    email:
      string
  ) {
    const resultado =
      await enviarRecuperacaoSenha(
        email
      );

    if (
      !resultado.sucesso
    ) {
      throw new Error(
        resultado.erro ||
        "Não foi possível enviar a recuperação de senha."
      );
    }
  }

  async function atualizarUsuario() {
    if (!usuario) {
      return;
    }

    const atualizado =
      await buscarUsuarioPorUid(
        usuario.uid
      );

    setUsuario(
      atualizado
    );

    if (
      vinculoSelecionadoId &&
      atualizado
    ) {
      const vinculoAtualizado =
        obterVinculo(
          atualizado,
          vinculoSelecionadoId
        );

      if (
        !vinculoAtualizado ||
        vinculoAtualizado.ativo ===
          false
      ) {
        setVinculoSelecionadoId(
          null
        );
      }
    }

    if (!atualizado) {
      setVinculoSelecionadoId(
        null
      );
    }
  }

  const value =
    useMemo<
      AuthContextType
    >(
      () => ({
        usuario,

        carregando,

        vinculosAtivos,

        vinculoSelecionadoId,

        vinculoSelecionado,

        selecionarVinculo,

        selecionarCarteiraGeral,

        login,

        logout,

        recuperarSenha,

        atualizarUsuario,
      }),
      [
        usuario,
        carregando,
        vinculosAtivos,
        vinculoSelecionadoId,
        vinculoSelecionado,
      ]
    );

  return (
    <AuthContext.Provider
      value={
        value
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro do AuthProvider."
    );
  }

  return context;
}
