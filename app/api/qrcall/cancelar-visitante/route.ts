import {
  ref,
  remove,
  runTransaction,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";

export const runtime =
  "nodejs";

// QRCALL_A8_2_API_CANCELAR_VISITANTE
export async function POST(
  request: Request
) {
  try {
    const corpo =
      await request.json();

    const unidadeId =
      String(
        corpo?.unidadeId || ""
      ).trim();

    const criadoEmEsperado =
      String(
        corpo?.criadoEmEsperado || ""
      ).trim();

    if (
      !unidadeId ||
      !criadoEmEsperado
    ) {
      return Response.json(
        {
          sucesso: false,
          erro:
            "Identidade da chamada incompleta.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Firebase nao permite estes caracteres
     * em uma chave. Tambem bloqueia caminhos
     * injetados pelo cliente.
     */
    if (
      /[.#$[\]/]/.test(
        unidadeId
      )
    ) {
      return Response.json(
        {
          sucesso: false,
          erro:
            "Unidade invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const chamadaRef =
      ref(
        db,
        `unidades-v2/${unidadeId}/chamada`
      );

    /*
     * Transacao:
     *
     * so remove se criadoEm ainda for EXATAMENTE
     * o mesmo da pagina que esta abandonando.
     *
     * Se outra chamada ja tiver sido criada para
     * a mesma unidade, ela fica intocada.
     */
    const resultado =
      await runTransaction(
        chamadaRef,
        (chamadaAtual) => {
          if (!chamadaAtual) {
            return;
          }

          const criadoEmAtual =
            String(
              chamadaAtual.criadoEm || ""
            );

          if (
            criadoEmAtual !==
            criadoEmEsperado
          ) {
            return;
          }

          return null;
        },
        {
          applyLocally: false,
        }
      );

    if (!resultado.committed) {
      const chamadaAtual =
        resultado.snapshot.val();

      /*
       * Ja nao existe:
       * para o visitante isso ja e sucesso.
       */
      if (!chamadaAtual) {
        return Response.json({
          sucesso: true,
          jaEncerrada: true,
        });
      }

      /*
       * Existe outra identidade.
       * Nunca apagar a chamada nova.
       */
      return Response.json(
        {
          sucesso: false,
          ignorada:
            "identidade_diferente",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * A sessao Live tem caminho proprio,
     * derivado da mesma identidade criadoEm.
     */
    const criadoMs =
      Date.parse(
        criadoEmEsperado
      );

    if (
      Number.isFinite(
        criadoMs
      )
    ) {
      try {
        await remove(
          ref(
            db,
            `qrcall-live/${unidadeId}/${String(criadoMs)}`
          )
        );
      } catch (erroLive) {
        console.warn(
          "QRCALL_A8_2_REMOVER_LIVE:",
          erroLive
        );
      }
    }

    return Response.json({
      sucesso: true,
      cancelada: true,
    });

  } catch (erro) {
    console.error(
      "QRCALL_A8_2_CANCELAR_VISITANTE:",
      erro
    );

    return Response.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro ao cancelar chamada.",
      },
      {
        status: 500,
      }
    );
  }
}