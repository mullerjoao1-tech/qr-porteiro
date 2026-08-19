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

    const chamadaAtual =
      snapshot.val() || {};

    if (
      chamadaAtual.status !==
      "Aguardando atendimento"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A chamada não está aguardando atendimento.",
          statusAtual:
            chamadaAtual.status || null,
        },
        {
          status: 409,
        }
      );
    }

    const agoraIso =
      new Date().toISOString();

    const agoraMs =
      Date.now();

    await referencia.update({
      status:
        "Em atendimento",

      notificar:
        false,

      atendidoEm:
        agoraIso,

      ultimaAtividade:
        agoraMs,
    });

    return NextResponse.json({
      sucesso: true,
      unidadeId,
      status:
        "Em atendimento",
      atendidoEm:
        agoraIso,
    });

  } catch (erro) {
    console.error(
      "QRCALL_ATENDER_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno ao atender chamada.",
      },
      {
        status: 500,
      }
    );
  }
}