import { NextResponse } from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResponsavelBanco = {
  usuarioId?: string;
  nome?: string;
  prioridade?: number;
  status?: string;
  ativo?: boolean;
};

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

    const chamadaRef =
      database.ref(
        `unidades-v2/${unidadeId}/chamada`
      );

    const chamadaSnapshot =
      await chamadaRef.get();

    if (!chamadaSnapshot.exists()) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Chamada nao existe.",
        },
        {
          status: 404,
        }
      );
    }

    const chamada =
      chamadaSnapshot.val() || {};

    if (
      chamada.status !==
      "Aguardando atendimento"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Chamada nao esta aguardando atendimento.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      String(
        chamada.criadoEm || ""
      ).trim() !== criadoEmEsperado
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
        chamada.responsavelAtualUid || ""
      ).trim() !== responsavelUidEsperado
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

    const responsaveisSnapshot =
      await database
        .ref(
          `unidades-v2/${unidadeId}/responsaveis`
        )
        .get();

    const responsaveisDados =
      responsaveisSnapshot.val() as
        Record<
          string,
          ResponsavelBanco
        > | null;

    if (!responsaveisDados) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Nenhum responsavel cadastrado na arquitetura nova.",
        },
        {
          status: 409,
        }
      );
    }

    const responsaveis =
      Object.entries(
        responsaveisDados
      )
        .map(
          (
            [
              id,
              dados,
            ]
          ) => ({
            id,

            usuarioId:
              String(
                dados?.usuarioId || ""
              ).trim(),

            nome:
              String(
                dados?.nome ||
                "Responsavel"
              ),

            prioridade:
              Number.isFinite(
                Number(
                  dados?.prioridade
                )
              )
                ? Number(
                    dados?.prioridade
                  )
                : 999,

            status:
              String(
                dados?.status ||
                "disponivel"
              ),

            ativo:
              dados?.ativo !== false,
          })
        )
        .sort(
          (
            a,
            b
          ) => {
            if (
              a.prioridade !==
              b.prioridade
            ) {
              return (
                a.prioridade -
                b.prioridade
              );
            }

            return a.nome.localeCompare(
              b.nome,
              "pt-BR"
            );
          }
        );

    const responsavelAtualId =
      String(
        chamada.responsavelAtualId || ""
      ).trim() ||
      (
        responsaveis.find(
          (
            responsavel
          ) =>
            responsavel.usuarioId ===
            responsavelUidEsperado
        )?.id ||
        ""
      );

    if (!responsavelAtualId) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Responsavel atual nao localizado na unidade.",
        },
        {
          status: 409,
        }
      );
    }

    const ignoradosAnteriores =
      Array.isArray(
        chamada.responsaveisIgnorados
      )
        ? chamada.responsaveisIgnorados.map(
            (
              valor: unknown
            ) =>
              String(
                valor || ""
              ).trim()
          )
        : [];

    const responsaveisIgnorados =
      Array.from(
        new Set(
          [
            ...ignoradosAnteriores,
            responsavelAtualId,
          ].filter(Boolean)
        )
      );

    const proximo =
      responsaveis.find(
        (
          responsavel
        ) =>
          !responsaveisIgnorados.includes(
            responsavel.id
          ) &&
          responsavel.ativo &&
          responsavel.status ===
            "disponivel" &&
          !!responsavel.usuarioId
      );

    /*
     * A alteracao da identidade da chamada e feita
     * em transaction para impedir que uma requisicao
     * atrasada de R1 modifique uma chamada que ja
     * passou para R2 ou que ja foi atendida.
     */
    const agora =
      Date.now();

    let primeiraExecucaoTransaction = true;

    const transacao =
      await chamadaRef.transaction(
        (
          atual
        ) => {
          if (
            atual === null &&
            primeiraExecucaoTransaction
          ) {
            primeiraExecucaoTransaction = false;
            atual = chamada;
          } else {
            primeiraExecucaoTransaction = false;
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
              atual.responsavelAtualUid ||
              ""
            ).trim() !==
            responsavelUidEsperado
          ) {
            return;
          }

          if (!proximo) {
            return {
              ...atual,

              responsaveisIgnorados,

              responsavelAtualId:
                null,

              responsavelAtualUid:
                null,

              responsavelAtualNome:
                null,

              responsavelAtualPrioridade:
                null,

              aguardandoResponsavel:
                false,

              status:
                "Encerrado",

              notificar:
                false,

              motivoSemResponsavel:
                "Nenhum outro responsavel disponivel.",

              mensagemResponsavel:
                "Nenhum responsavel pode atender no momento.",

              encerradoEm:
                new Date(
                  agora
                ).toISOString(),

              escalonamentoAtualizadoEm:
                agora,
            };
          }

          return {
            ...atual,

            responsaveisIgnorados,

            responsavelAtualId:
              proximo.id,

            responsavelAtualUid:
              proximo.usuarioId,

            responsavelAtualNome:
              proximo.nome,

            responsavelAtualPrioridade:
              proximo.prioridade,

            aguardandoResponsavel:
              false,

            escalonamentoAtualizadoEm:
              agora,
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

    if (!proximo) {
      return NextResponse.json({
        sucesso: true,
        encaminhada: false,
        encerrada: true,
        motivo:
          "Nenhum outro responsavel disponivel.",
      });
    }

    /*
     * Depois da transaction, a chamada ja aponta para R2.
     * A API de push atual consulta responsavelAtualUid
     * e envia chamada-v2 somente ao novo responsavel.
     */
    const urlPush =
      new URL(
        "/api/enviar-notificacao-v2",
        request.url
      );

    const respostaPush =
      await fetch(
        urlPush,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tipo:
              "chamada-v2",

            unidadeId,
          }),
        }
      );

    if (!respostaPush.ok) {
      const erroPush =
        await respostaPush.text();

      console.error(
        "QRCALL_NAO_POSSO_PUSH_ERRO:",
        erroPush
      );

      return NextResponse.json(
        {
          sucesso: false,
          encaminhada: true,
          responsavel: {
            id:
              proximo.id,
            usuarioId:
              proximo.usuarioId,
            nome:
              proximo.nome,
            prioridade:
              proximo.prioridade,
          },
          erro:
            "Responsavel alterado, mas o push do proximo responsavel falhou.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      sucesso: true,
      encaminhada: true,

      responsavel: {
        id:
          proximo.id,

        usuarioId:
          proximo.usuarioId,

        nome:
          proximo.nome,

        prioridade:
          proximo.prioridade,
      },
    });

  } catch (erro) {
    console.error(
      "QRCALL_NAO_POSSO_ATENDER_ERRO:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno ao encaminhar chamada.",
      },
      {
        status: 500,
      }
    );
  }
}
