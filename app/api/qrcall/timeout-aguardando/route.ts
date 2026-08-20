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

    const criadoEmEsperado =
      String(
        body?.criadoEmEsperado || ""
      ).trim();

    if (
      !unidadeId ||
      !criadoEmEsperado
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "unidadeId e criadoEmEsperado são obrigatórios.",
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
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "Chamada não existe mais.",
      });
    }

    const chamada =
      snapshot.val() || {};

    if (
      chamada.status !==
      "Aguardando atendimento"
    ) {
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "Chamada não está mais aguardando atendimento.",
        statusAtual:
          chamada.status || null,
      });
    }

    if (
      String(
        chamada.criadoEm || ""
      ) !== criadoEmEsperado
    ) {
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "A chamada ativa já é outra.",
      });
    }

    const criadoEmMs =
      new Date(
        criadoEmEsperado
      ).getTime();

    if (
      !Number.isFinite(
        criadoEmMs
      )
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "criadoEmEsperado inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const agora =
      Date.now();

    const tempoDecorrido =
      agora - criadoEmMs;

    const tresMinutos =
      3 * 60 * 1000;

    if (
      tempoDecorrido <
      tresMinutos
    ) {
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "A chamada ainda não atingiu 3 minutos.",
        faltamMs:
          tresMinutos -
          tempoDecorrido,
      });
    }

    const agoraIso =
      new Date(
        agora
      ).toISOString();

    await database
      .ref(
        `historico-v2/${unidadeId}/${agora}`
      )
      .set({
        ...chamada,

        statusFinal:
          "Encerrado",

        tipoFinalizacao:
          "Timeout sem atendimento",

        encerradoEm:
          agoraIso,
      });

    const snapshotFinal =
      await referencia.get();

    const chamadaFinal =
      snapshotFinal.val();

    if (
      chamadaFinal &&
      chamadaFinal.status ===
        "Aguardando atendimento" &&
      String(
        chamadaFinal.criadoEm || ""
      ) === criadoEmEsperado
    ) {
      await referencia.remove();

      return NextResponse.json({
        sucesso: true,
        encerrada: true,
        unidadeId,
        tipoFinalizacao:
          "Timeout sem atendimento",
        encerradoEm:
          agoraIso,
      });
    }

    return NextResponse.json({
      sucesso: true,
      encerrada: false,
      motivo:
        "A chamada mudou durante a verificação e foi preservada.",
    });

  } catch (erro) {
    console.error(
      "QRCALL_TIMEOUT_AGUARDANDO_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno no timeout da chamada.",
      },
      {
        status: 500,
      }
    );
  }
}
