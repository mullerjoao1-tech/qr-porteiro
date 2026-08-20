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

    const atendidoEmEsperado =
      String(
        body?.atendidoEmEsperado || ""
      ).trim();

    if (
      !unidadeId ||
      !atendidoEmEsperado
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "unidadeId e atendidoEmEsperado são obrigatórios.",
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
      "Em atendimento"
    ) {
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "Chamada não está mais em atendimento.",
        statusAtual:
          chamada.status || null,
      });
    }

    if (
      String(
        chamada.atendidoEm || ""
      ) !== atendidoEmEsperado
    ) {
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "O atendimento ativo já é outro.",
      });
    }

    const atendidoEmMs =
      new Date(
        atendidoEmEsperado
      ).getTime();

    if (
      !Number.isFinite(
        atendidoEmMs
      )
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "atendidoEmEsperado inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const agora =
      Date.now();

    const doisMinutos =
      2 * 60 * 1000;

    if (
      agora - atendidoEmMs <
      doisMinutos
    ) {
      return NextResponse.json({
        sucesso: true,
        encerrada: false,
        motivo:
          "O atendimento ainda não atingiu 2 minutos.",
        faltamMs:
          doisMinutos -
          (agora - atendidoEmMs),
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
          "Timeout pós-atendimento",

        encerradoEm:
          agoraIso,
      });

    const criadoEmEsperado =
      chamada?.criadoEm || null;

    const snapshotFinal =
      await referencia.get();

    const chamadaFinal =
      snapshotFinal.val();

    if (
      chamadaFinal &&
      chamadaFinal.status ===
        "Em atendimento" &&
      chamadaFinal.criadoEm ===
        criadoEmEsperado &&
      String(
        chamadaFinal.atendidoEm || ""
      ) === atendidoEmEsperado
    ) {
      await referencia.remove();

      return NextResponse.json({
        sucesso: true,
        encerrada: true,
        unidadeId,
        tipoFinalizacao:
          "Timeout pós-atendimento",
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
      "QRCALL_TIMEOUT_ATENDIMENTO_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno no timeout pós-atendimento.",
      },
      {
        status: 500,
      }
    );
  }
}
