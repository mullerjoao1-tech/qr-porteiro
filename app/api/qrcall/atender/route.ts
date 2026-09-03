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

    const responsavelUidEsperado =
      String(
        body?.responsavelUidEsperado || ""
      ).trim();

    if (
      !unidadeId ||
      !criadoEmEsperado ||
      !responsavelUidEsperado
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "unidadeId, criadoEmEsperado e responsavelUidEsperado sao obrigatorios.",
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
          erro:
            "Nenhuma chamada ativa encontrada.",
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
            "A chamada nao esta aguardando atendimento.",
          statusAtual:
            chamadaAtual.status || null,
        },
        {
          status: 409,
        }
      );
    }

    if (
      String(
        chamadaAtual.criadoEm || ""
      ).trim() !==
      criadoEmEsperado
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Esta operacao pertence a outra chamada.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      String(
        chamadaAtual.responsavelAtualUid || ""
      ).trim() !==
      responsavelUidEsperado
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A chamada ja pertence a outro responsavel.",
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

    let primeiraExecucaoTransaction =
      true;

    const transacao =
      await referencia.transaction(
        (atual) => {
          if (
            atual === null &&
            primeiraExecucaoTransaction
          ) {
            primeiraExecucaoTransaction =
              false;

            atual =
              chamadaAtual;
          } else {
            primeiraExecucaoTransaction =
              false;
          }

          if (!atual) {
            return;
          }

          if (
            atual.status !==
            "Aguardando atendimento"
          ) {
            return;
          }

          if (
            String(
              atual.criadoEm || ""
            ).trim() !==
            criadoEmEsperado
          ) {
            return;
          }

          if (
            String(
              atual.responsavelAtualUid || ""
            ).trim() !==
            responsavelUidEsperado
          ) {
            return;
          }

          return {
            ...atual,

            status:
              "Em atendimento",

            notificar:
              false,

            atendidoEm:
              agoraIso,

            ultimaAtividade:
              agoraMs,
          };
        }
      );

    if (!transacao.committed) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A chamada mudou durante a operacao e foi preservada.",
        },
        {
          status: 409,
        }
      );
    }

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