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

    const agoraIso =
      new Date().toISOString();

    await database
      .ref(
        `historico-v2/${unidadeId}/${agora}`
      )
      .set({
        ...chamada,

        statusFinal:
          "Encerrado",

        tipoFinalizacao:
          "Manual QrCall",

        encerradoEm:
          agoraIso,
      });

    await referencia.update({
      status:
        "Encerrado",

      notificar:
        false,

      encerradoEm:
        agoraIso,

      ultimaAtividade:
        agora,

      motivoSemResponsavel:
        null,
    });

    const criadoEmEncerrado =
      chamada?.criadoEm || null;

    const snapshotAtual =
      await referencia.get();

    const chamadaAtual =
      snapshotAtual.val();

    if (
      chamadaAtual &&
      chamadaAtual.status ===
        "Encerrado" &&
      chamadaAtual.criadoEm ===
        criadoEmEncerrado
    ) {
      await referencia.remove();
    }

    return NextResponse.json({
      sucesso: true,
      unidadeId,
      status:
        "Encerrado",
      encerradoEm:
        agoraIso,
    });

  } catch (erro) {
    console.error(
      "QRCALL_FINALIZAR_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno ao finalizar atendimento.",
      },
      {
        status: 500,
      }
    );
  }
}