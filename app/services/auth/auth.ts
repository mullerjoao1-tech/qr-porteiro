"use client";

import {
  type User,
  type UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../firebase";

export type ResultadoAutenticacao = {
  sucesso:
    boolean;

  usuario?:
    User;

  credencial?:
    UserCredential;

  erro?:
    string;
};

function traduzirErroFirebase(
  codigo?:
    string
): string {
  switch (codigo) {
    case "auth/invalid-email":
      return "E-mail inválido.";

    case "auth/user-disabled":
      return "Este usuário foi desativado.";

    case "auth/user-not-found":
      return "Usuário não encontrado.";

    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";

    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";

    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";

    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

    case "auth/network-request-failed":
      return "Não foi possível conectar. Verifique sua internet.";

    default:
      return "Não foi possível concluir a operação.";
  }
}

function obterCodigoErro(
  erro:
    unknown
): string | undefined {
  if (
    typeof erro ===
      "object" &&
    erro !==
      null &&
    "code" in
      erro &&
    typeof (
      erro as {
        code?:
          unknown;
      }
    ).code ===
      "string"
  ) {
    return (
      erro as {
        code:
          string;
      }
    ).code;
  }

  return undefined;
}

function normalizarEmail(
  email:
    string
): string {
  return email
    .trim()
    .toLowerCase();
}

export async function entrarComEmailSenha(
  email:
    string,
  senha:
    string
): Promise<ResultadoAutenticacao> {
  try {
    const emailNormalizado =
      normalizarEmail(
        email
      );

    if (!emailNormalizado) {
      return {
        sucesso:
          false,

        erro:
          "Informe o e-mail.",
      };
    }

    if (!senha) {
      return {
        sucesso:
          false,

        erro:
          "Informe a senha.",
      };
    }

    const credencial =
      await signInWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha
      );

    return {
      sucesso:
        true,

      usuario:
        credencial.user,

      credencial,
    };
  } catch (erro) {
    return {
      sucesso:
        false,

      erro:
        traduzirErroFirebase(
          obterCodigoErro(
            erro
          )
        ),
    };
  }
}

export async function criarContaComEmailSenha(
  email:
    string,
  senha:
    string
): Promise<ResultadoAutenticacao> {
  try {
    const emailNormalizado =
      normalizarEmail(
        email
      );

    if (!emailNormalizado) {
      return {
        sucesso:
          false,

        erro:
          "Informe o e-mail.",
      };
    }

    if (
      senha.length <
      6
    ) {
      return {
        sucesso:
          false,

        erro:
          "A senha precisa ter pelo menos 6 caracteres.",
      };
    }

    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha
      );

    return {
      sucesso:
        true,

      usuario:
        credencial.user,

      credencial,
    };
  } catch (erro) {
    return {
      sucesso:
        false,

      erro:
        traduzirErroFirebase(
          obterCodigoErro(
            erro
          )
        ),
    };
  }
}

export async function sairDaConta():
  Promise<
    ResultadoAutenticacao
  > {
  try {
    await signOut(
      auth
    );

    return {
      sucesso:
        true,
    };
  } catch (erro) {
    return {
      sucesso:
        false,

      erro:
        traduzirErroFirebase(
          obterCodigoErro(
            erro
          )
        ),
    };
  }
}

export async function enviarRecuperacaoSenha(
  email:
    string
): Promise<ResultadoAutenticacao> {
  try {
    const emailNormalizado =
      normalizarEmail(
        email
      );

    if (!emailNormalizado) {
      return {
        sucesso:
          false,

        erro:
          "Informe o e-mail.",
      };
    }

    await sendPasswordResetEmail(
      auth,
      emailNormalizado
    );

    return {
      sucesso:
        true,
    };
  } catch (erro) {
    return {
      sucesso:
        false,

      erro:
        traduzirErroFirebase(
          obterCodigoErro(
            erro
          )
        ),
    };
  }
}

export function observarUsuarioAutenticado(
  callback:
    (
      usuario:
        User | null
    ) => void
): () => void {
  return onAuthStateChanged(
    auth,
    callback
  );
}

export function obterUsuarioAtual():
  User | null {
  return auth.currentUser;
}

export function usuarioEstaAutenticado():
  boolean {
  return (
    auth.currentUser !==
    null
  );
}
