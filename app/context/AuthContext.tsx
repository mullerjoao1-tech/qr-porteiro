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

import type { Usuario } from "@/app/types/Usuario";

type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      observarUsuarioAutenticado(
        async (firebaseUser) => {
          if (!firebaseUser) {
            setUsuario(null);
            setCarregando(false);
            return;
          }

          const usuarioBanco =
            await buscarUsuarioPorUid(
              firebaseUser.uid
            );

          if (usuarioBanco) {
            setUsuario(usuarioBanco);

            await registrarUltimoLogin(
              firebaseUser.uid
            );
          } else {
            setUsuario(null);
          }

          setCarregando(false);
        }
      );

    return unsubscribe;
  }, []);

  async function login(
    email: string,
    senha: string
  ) {
    setCarregando(true);

    const credencial =
      await entrarComEmailSenha(
        email,
        senha
      );
if (!credencial.usuario) {
  throw new Error("Usuário não autenticado.");
}
    const usuarioBanco =
      await buscarUsuarioPorUid(
        credencial.usuario.uid
      );

    if (usuarioBanco) {
      setUsuario(usuarioBanco);

      await registrarUltimoLogin(
        credencial.usuario.uid
      );
    }

    setCarregando(false);
  }

  async function logout() {
    await sairDaConta();

    setUsuario(null);
  }

  async function recuperarSenha(
    email: string
  ) {
    await enviarRecuperacaoSenha(email);
  }

  async function atualizarUsuario() {
    if (!usuario) return;

    const atualizado =
      await buscarUsuarioPorUid(
        usuario.uid
      );

    if (atualizado) {
      setUsuario(atualizado);
    }
  }

  const value = useMemo(
    () => ({
      usuario,
      carregando,
      login,
      logout,
      recuperarSenha,
      atualizarUsuario,
    }),
    [usuario, carregando]
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