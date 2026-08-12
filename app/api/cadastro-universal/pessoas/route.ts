import { randomBytes } from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

import {
  buscarOuCriarPessoaUniversal,
} from "@/app/services/usuarios/CadastroPessoaUniversal";

type CorpoCadastroPessoa = {
  nome?: unknown;
  email?: unknown;
  telefone?: unknown;
  cpf?: unknown;
};

function texto(valor: unknown): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function criarSenhaProvisoria(): string {
  return `Qr@${randomBytes(8).toString("hex")}`;
}

export async function POST(
  request: NextRequest
) {
  try {
    const corpo =
      (await request.json()) as CorpoCadastroPessoa;

    const nome = texto(corpo.nome);
    const email = texto(corpo.email)
      .toLowerCase();
    const telefone = texto(corpo.telefone);
    const cpf = texto(corpo.cpf);

    if (!nome) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Informe o nome da pessoa.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Informe o e-mail da pessoa.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      auth,
      database,
    } = obterFirebaseAdmin();

    const resultado =
      await buscarOuCriarPessoaUniversal({
        auth,
        database,
        nome,
        email,
        telefone,
        cpf,
        senhaProvisoria:
          criarSenhaProvisoria(),
        origem:
          "cadastro-universal-manual",
      });

    return NextResponse.json({
      sucesso: true,

      pessoa: {
        uid: resultado.uid,
        emailPrincipal:
          resultado.emailPrincipal,
        emailInformado:
          resultado.emailInformado,
        cpf:
          resultado.cpfNormalizado ?? "",
      },

      criado:
        resultado.criadoNoAuthentication,

      reutilizado:
        resultado.reutilizado,

      encontradoPor:
        resultado.encontradoPor,
    });
  } catch (erro) {
    console.error(
      "Erro no cadastro universal de pessoa:",
      erro
    );

    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível cadastrar a pessoa.";

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      {
        status: 400,
      }
    );
  }
}
