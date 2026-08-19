import { NextResponse } from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const unidadeId =
      String(
        body?.unidadeId || ""
      ).trim();

    const mensagem =
      String(
        body?.mensagem || ""
      ).trim();

    if (!unidadeId) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "unidadeId obrigatório",
        },
        {
          status: 400,
        }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "mensagem obrigatória",
        },
        {
          status: 400,
        }
      );
    }

    const {
      database,
    } = obterFirebaseAdmin();

    const referencia =
      database.ref(
        `unidades-v2/${unidadeId}/chamada`
      );

    const snapshot =
      await referencia.get();

    if (!snapshot.exists()) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Nenhuma chamada ativa encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const chamada =
      snapshot.val() || {};

    if (
      chamada.status !==
      "Em atendimento"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A chamada não está em atendimento.",
          statusAtual:
            chamada.status || null,
        },
        {
          status: 409,
        }
      );
    }

    const agora =
      Date.now();

    await referencia.update({
      mensagemRapida:
        mensagem,

      enviadoEm:
        agora,

      ultimaAtividade:
        agora,
    });

    return NextResponse.json({
      sucesso: true,
      unidadeId,
      mensagem,
      enviadoEm:
        agora,
    });

  } catch (erro) {
    console.error(
      "QRCALL_RESPOSTA_RAPIDA_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno ao enviar resposta rápida.",
      },
      {
        status: 500,
      }
    );
  }
}