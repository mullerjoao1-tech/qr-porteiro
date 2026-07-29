"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import {
  entrarComEmailSenha,
  sairDaConta,
  enviarRecuperacaoSenha,
  observarUsuarioAutenticado,
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

import type { Usuario } from "@/app/types/Usuario";

type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;

  vinculosAtivos: Array<
    [string, VinculoComPermissoes]
  >;

  /**
   * null = Carteira Geral.
   * string = local específico selecionado.
   */
  vinculoSelecionadoId: string | null;

  /**
   * null = Carteira Geral.
   */
  vinculoSelecionado: VinculoComPermissoes | null;

  selecionarVinculo: (
    vinculoId: string
  ) => void;

  selecionarCarteiraGeral: () => void;

  login: (
    email: string,
    senha: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  recuperarSenha: (
    email: string
  ) => Promise<void>;

  atualizarUsuario: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  /**
   * null representa a Carteira Geral.
   */
  const [
    vinculoSelecionadoId,
    setVinculoSelecionadoId,
  ] = useState<string | null>(null);

  function definirUsuario(
    usuarioBanco: Usuario | null
  ) {
    setUsuario(usuarioBanco);

    /**
     * Todo novo login ou troca de usuário começa
     * pela visão consolidada da Carteira Geral.
     */
    setVinculoSelecionadoId(null);
  }

  useEffect(() => {
    const unsubscribe =
      observarUsuarioAutenticado(
        async (firebaseUser) => {
          try {
            if (!firebaseUser) {
              definirUsuario(null);
              return;
            }

            const usuarioBanco =
              await buscarUsuarioPorUid(
                firebaseUser.uid
              );

            definirUsuario(usuarioBanco);

            if (usuarioBanco) {
              await registrarUltimoLogin(
                firebaseUser.uid
              );
            }
          } finally {
            setCarregando(false);
          }
        }
      );

    return unsubscribe;
  }, []);

  const vinculosAtivos =
    useMemo(
      () => obterVinculosAtivos(usuario),
      [usuario]
    );

  const vinculoSelecionado =
    useMemo(() => {
      if (
        !usuario ||
        !vinculoSelecionadoId
      ) {
        return null;
      }

      const vinculo = obterVinculo(
        usuario,
        vinculoSelecionadoId
      );

      if (
        !vinculo ||
        vinculo.ativo === false
      ) {
        return null;
      }

      return vinculo;
    }, [
      usuario,
      vinculoSelecionadoId,
    ]);

  function selecionarVinculo(
    vinculoId: string
  ) {
    if (!usuario) {
      return;
    }

    const vinculo = obterVinculo(
      usuario,
      vinculoId
    );

    if (
      !vinculo ||
      vinculo.ativo === false
    ) {
      throw new Error(
        "Este vínculo não existe ou está inativo."
      );
    }

    setVinculoSelecionadoId(vinculoId);
  }

  function selecionarCarteiraGeral() {
    setVinculoSelecionadoId(null);
  }

  async function login(
    email: string,
    senha: string
  ) {
    setCarregando(true);

    try {
      const credencial =
        await entrarComEmailSenha(
          email,
          senha
        );

      if (!credencial.usuario) {
        throw new Error(
          "Usuário não autenticado."
        );
      }

      const usuarioBanco =
        await buscarUsuarioPorUid(
          credencial.usuario.uid
        );

      if (!usuarioBanco) {
        definirUsuario(null);

        throw new Error(
          "Usuário autenticado, mas sem cadastro na plataforma."
        );
      }

      definirUsuario(usuarioBanco);

      await registrarUltimoLogin(
        credencial.usuario.uid
      );
    } finally {
      setCarregando(false);
    }
  }

  async function logout() {
    await sairDaConta();

    definirUsuario(null);
  }

  async function recuperarSenha(
    email: string
  ) {
    await enviarRecuperacaoSenha(email);
  }

  async function atualizarUsuario() {
    if (!usuario) {
      return;
    }

    const atualizado =
      await buscarUsuarioPorUid(
        usuario.uid
      );

    setUsuario(atualizado);

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
        vinculoAtualizado.ativo === false
      ) {
        setVinculoSelecionadoId(null);
      }
    }
  }

  const value = useMemo(
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro do AuthProvider."
    );
  }

  return context;
}
