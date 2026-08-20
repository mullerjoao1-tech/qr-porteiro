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

    const audioBase64 =
      String(
        body?.audioBase64 || ""
      ).trim();

    if (!unidadeId) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "unidadeId Ã© obrigatÃ³rio",
        },
        {
          status: 400,
        }
      );
    }

    if (!audioBase64) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "audioBase64 Ã© obrigatÃ³rio",
        },
        {
          status: 400,
        }
      );
    }

    const {
      database,
    } = obterFirebaseAdmin();

    const criadoEm =
      Date.now();

    const idMensagem =
      String(criadoEm);

    const referenciaMensagem =
      database.ref(
        `unidades-v2/${unidadeId}/chamada/mensagens/${idMensagem}`
      );

    const referenciaChamada =
      database.ref(
        `unidades-v2/${unidadeId}/chamada`
      );

    const snapshotChamada =
      await referenciaChamada.get();

    const chamadaAtual =
      snapshotChamada.val() || {};

    const chamadaId =
      String(
        chamadaAtual?.chamadaId || ""
      ).trim();

    if (!chamadaId) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "A chamada atual não possui chamadaId.",
        },
        {
          status: 409,
        }
      );
    }

    await referenciaMensagem.set({
      autor:
        "morador",

      tipo:
        "audio",

      audioBase64,

      criadoEm,

      chamadaId,
    });

    await referenciaChamada.update({
      audioBase64,

      ultimaAtividade:
        criadoEm,

      enviadoEm:
        criadoEm,
    });

    return NextResponse.json({
      sucesso: true,
      idMensagem,
      criadoEm,
    });

  } catch (erro) {
    console.error(
      "QRCALL_AUDIO_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno ao enviar Ã¡udio.",
      },
      {
        status: 500,
      }
    );
  }
}
