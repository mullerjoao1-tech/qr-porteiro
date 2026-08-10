import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

type UsuarioBanco = {
  uid?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  status?: string;

  perfilPrincipal?: string;

  perfis?: Record<
    string,
    boolean
  >;

  condominios?: Record<
    string,
    {
      ativo?: boolean;
      perfilPrincipal?: string;
      perfis?: Record<
        string,
        boolean
      >;
    }
  >;

  locais?: Record<
    string,
    {
      ativo?: boolean;
      perfilPrincipal?: string;
      perfis?: Record<
        string,
        boolean
      >;
    }
  >;
};

function texto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function obterTokenBearer(
  request: NextRequest
): string {
  const cabecalho =
    request.headers.get(
      "authorization"
    );

  if (
    !cabecalho ||
    !cabecalho.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "Token de autenticação não informado."
    );
  }

  const token =
    cabecalho
      .slice(
        "Bearer ".length
      )
      .trim();

  if (!token) {
    throw new Error(
      "Token de autenticação inválido."
    );
  }

  return token;
}

function possuiPerfilAdministradorMaster(
  usuario: UsuarioBanco
): boolean {
  if (
    usuario.perfilPrincipal ===
      "administrador_master" ||
    usuario.perfis
      ?.administrador_master ===
      true
  ) {
    return true;
  }

  const vinculos = [
    ...Object.values(
      usuario.condominios ?? {}
    ),
    ...Object.values(
      usuario.locais ?? {}
    ),
  ];

  return vinculos.some(
    (vinculo) => {
      if (
        vinculo.ativo === false
      ) {
        return false;
      }

      return (
        vinculo.perfilPrincipal ===
          "administrador_master" ||
        vinculo.perfis
          ?.administrador_master ===
          true
      );
    }
  );
}

async function validarAdministradorMaster(
  request: NextRequest
) {
  const {
    auth,
    database,
  } =
    obterFirebaseAdmin();

  const token =
    obterTokenBearer(
      request
    );

  const tokenDecodificado =
    await auth.verifyIdToken(
      token
    );

  const snapshot =
    await database
      .ref(
        `usuarios-v2/${tokenDecodificado.uid}`
      )
      .get();

  if (
    !snapshot.exists()
  ) {
    throw new Error(
      "O usuário autenticado não possui cadastro no QR Core."
    );
  }

  const usuario =
    snapshot.val() as UsuarioBanco;

  if (
    usuario.status ===
    "inativo"
  ) {
    throw new Error(
      "O usuário autenticado não está ativo."
    );
  }

  if (
    !possuiPerfilAdministradorMaster(
      usuario
    )
  ) {
    throw new Error(
      "Apenas o Administrador Master pode regularizar acessos."
    );
  }

  return {
    uid:
      tokenDecodificado.uid,
    usuario,
  };
}

function codigoErro(
  erro: unknown
): string {
  if (
    typeof erro !== "object" ||
    erro === null ||
    !("code" in erro)
  ) {
    return "";
  }

  return String(
    (
      erro as {
        code?: unknown;
      }
    ).code ?? ""
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    await validarAdministradorMaster(
      request
    );

    const {
      auth,
      database,
    } =
      obterFirebaseAdmin();

    const corpo =
      (
        await request.json()
      ) as {
        uid?: unknown;
        senhaProvisoria?: unknown;
      };

    const uid =
      texto(
        corpo.uid
      );

    const senhaProvisoria =
      texto(
        corpo.senhaProvisoria
      );

    if (!uid) {
      return NextResponse.json(
        {
          sucesso:
            false,
          erro:
            "Informe o UID da pessoa.",
        },
        {
          status:
            400,
        }
      );
    }

    const snapshot =
      await database
        .ref(
          `usuarios-v2/${uid}`
        )
        .get();

    if (
      !snapshot.exists()
    ) {
      return NextResponse.json(
        {
          sucesso:
            false,
          erro:
            "Pessoa não encontrada em usuarios-v2.",
          uid,
        },
        {
          status:
            404,
        }
      );
    }

    const usuarioBanco =
      snapshot.val() as UsuarioBanco;

    const nome =
      texto(
        usuarioBanco.nome
      );

    const email =
      texto(
        usuarioBanco.email
      ).toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          sucesso:
            false,
          erro:
            "A pessoa não possui e-mail cadastrado.",
          uid,
        },
        {
          status:
            400,
        }
      );
    }

    let usuarioAuth = null;
    let criadoAgora =
      false;

    try {
      usuarioAuth =
        await auth.getUser(
          uid
        );
    } catch (erro) {
      const codigo =
        codigoErro(
          erro
        );

      if (
        codigo !==
        "auth/user-not-found"
      ) {
        throw erro;
      }
    }

    if (!usuarioAuth) {
      let usuarioMesmoEmail =
        null;

      try {
        usuarioMesmoEmail =
          await auth
            .getUserByEmail(
              email
            );
      } catch (erro) {
        const codigo =
          codigoErro(
            erro
          );

        if (
          codigo !==
          "auth/user-not-found"
        ) {
          throw erro;
        }
      }

      if (
        usuarioMesmoEmail &&
        usuarioMesmoEmail.uid !==
          uid
      ) {
        return NextResponse.json(
          {
            sucesso:
              false,

            erro:
              "Já existe um usuário no Firebase Authentication com este e-mail, porém com outro UID.",

            uidBanco:
              uid,

            uidAuthentication:
              usuarioMesmoEmail.uid,

            email,
          },
          {
            status:
              409,
          }
        );
      }

      if (
        senhaProvisoria.length <
        6
      ) {
        return NextResponse.json(
          {
            sucesso:
              false,

            erro:
              "Para criar o login, informe uma senha provisória com pelo menos 6 caracteres.",

            uid,
            email,
          },
          {
            status:
              400,
          }
        );
      }

      usuarioAuth =
        await auth.createUser({
          uid,
          email,
          password:
            senhaProvisoria,
          displayName:
            nome || undefined,
          disabled:
            false,
        });

      criadoAgora =
        true;
    } else {
      const atualizacaoAuth: {
        disabled: boolean;
        displayName?: string;
      } = {
        disabled:
          false,
      };

      if (nome) {
        atualizacaoAuth
          .displayName =
          nome;
      }

      usuarioAuth =
        await auth.updateUser(
          uid,
          atualizacaoAuth
        );
    }

    const agora =
      Date.now();

    const atualizacaoBanco: Record<
      string,
      unknown
    > = {
      uid,
      email:
        usuarioAuth.email ??
        email,
      status:
        "ativo",
      atualizadoEm:
        agora,
      authenticationAtivo:
        true,
      authenticationUid:
        usuarioAuth.uid,
    };

    if (criadoAgora) {
      atualizacaoBanco
        .primeiroAcesso =
        true;

      atualizacaoBanco
        .precisaTrocarSenha =
        true;

      atualizacaoBanco
        .authenticationCriadoEm =
        agora;
    }

    await database
      .ref(
        `usuarios-v2/${uid}`
      )
      .update(
        atualizacaoBanco
      );

    return NextResponse.json(
      {
        sucesso:
          true,

        mensagem:
          criadoAgora
            ? "Login criado e acesso regularizado com sucesso."
            : "O usuário já possuía login. Acesso conferido e mantido ativo.",

        usuario: {
          uid:
            usuarioAuth.uid,

          nome:
            usuarioAuth
              .displayName ??
            nome,

          email:
            usuarioAuth.email ??
            email,

          criadoAgora,

          primeiroAcesso:
            criadoAgora,

          precisaTrocarSenha:
            criadoAgora,
        },
      },
      {
        status:
          200,
      }
    );
  } catch (erro) {
    console.error(
      "Erro ao regularizar acesso:",
      erro
    );

    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível regularizar o acesso.";

    const naoAutorizado =
      mensagem.includes(
        "Token"
      ) ||
      mensagem.includes(
        "Administrador Master"
      ) ||
      mensagem.includes(
        "autenticado"
      );

    return NextResponse.json(
      {
        sucesso:
          false,
        erro:
          mensagem,
      },
      {
        status:
          naoAutorizado
            ? 403
            : 500,
      }
    );
  }
}
