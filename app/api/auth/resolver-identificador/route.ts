import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

function texto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function normalizarIdentificador(
  valor: string
): string {
  return valor
    .trim()
    .toLowerCase();
}

export async function POST(
  request: NextRequest
) {
  try {
    const corpo =
      await request.json();

    const identificador =
      normalizarIdentificador(
        texto(
          corpo?.identificador
        )
      );

    if (!identificador) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Identificador nao informado.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      auth,
      database,
    } =
      obterFirebaseAdmin();

    const indiceSnapshot =
      await database
        .ref(
          `indices-v2/identificadorDependente/${identificador}`
        )
        .get();

    if (!indiceSnapshot.exists()) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Identificador nao encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const uid =
      texto(
        indiceSnapshot.val()
      );

    if (!uid) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Identificador invalido.",
        },
        {
          status: 404,
        }
      );
    }

    const usuarioSnapshot =
      await database
        .ref(
          `usuarios-v2/${uid}`
        )
        .get();

    if (!usuarioSnapshot.exists()) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Usuario do dependente nao encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const usuario =
      usuarioSnapshot.val();

    if (
      usuario?.status !==
      "ativo"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Usuario nao esta ativo.",
        },
        {
          status: 403,
        }
      );
    }

    const usuarioAuth =
      await auth.getUser(
        uid
      );

    const emailAutenticacao =
      texto(
        usuarioAuth.email
      ).toLowerCase();

    if (
      !emailAutenticacao ||
      !emailAutenticacao.endsWith(
        "@dependente.qracesso.local"
      )
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Identidade de autenticacao do dependente invalida.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      sucesso: true,
      emailAutenticacao,
    });
  } catch (erro) {
    console.error(
      "Erro ao resolver identificador do dependente:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          "Nao foi possivel validar o identificador.",
      },
      {
        status: 500,
      }
    );
  }
}