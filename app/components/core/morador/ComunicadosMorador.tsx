"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  onValue,
  ref,
  update,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";

type ComunicadoMorador = {
  id: string;

  condominioId:
    string;

  condominioNome:
    string;

  tipo:
    | "comunicado"
    | "assembleia"
    | "manutencao"
    | "emergencia";

  destinatario?:
    | "unidade"
    | "bloco"
    | "moradores"
    | "proprietarios"
    | "inquilinos"
    | "conselho"
    | "administradora"
    | "zeladoria"
    | "portaria";

  unidadeId?:
    string;

  blocoSelecionado?:
    string;

  unidadesDestinatarias?:
    string[];

  titulo:
    string;

  mensagem:
    string;

  detalhesModelo?: {
    dataEvento?:
      string;

    horarioEvento?:
      string;

    localEvento?:
      string;

    pauta?:
      string;

    empresaResponsavel?:
      string;

    impactoPrevisto?:
      string;

    tipoEmergencia?:
      string;

    orientacaoImediata?:
      string;
  };

  exigeCiencia?:
    boolean;

  exigirCiencia?:
    boolean;

  status:
    | "enviado"
    | "agendado";

  criadoEm:
    number;

  criadoEmFormatado:
    string;

  visualizacoes?: Record<
    string,
    {
      unidadeId:
        string;

      visualizadoEm?:
        number;

      ciente?:
        boolean;

      cienteEm?:
        number;
    }
  >;
};

type Props = {
  condominioId:
    string;

  unidadeId:
    string;

  localNome?:
    string;

  onVoltar?:
    () => void;
};

function iconeTipo(
  tipo:
    ComunicadoMorador["tipo"]
) {
  if (
    tipo ===
    "assembleia"
  ) {
    return "👥";
  }

  if (
    tipo ===
    "manutencao"
  ) {
    return "🛠️";
  }

  if (
    tipo ===
    "emergencia"
  ) {
    return "🚨";
  }

  return "📢";
}

function textoTipo(
  tipo:
    ComunicadoMorador["tipo"]
) {
  if (
    tipo ===
    "assembleia"
  ) {
    return "ASSEMBLEIA";
  }

  if (
    tipo ===
    "manutencao"
  ) {
    return "MANUTENÇÃO";
  }

  if (
    tipo ===
    "emergencia"
  ) {
    return "EMERGÊNCIA";
  }

  return "COMUNICADO";
}

function formatarData(
  valor?:
    string
) {
  if (!valor) {
    return "";
  }

  const [
    ano,
    mes,
    dia,
  ] =
    valor.split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

export default function ComunicadosMorador({
  condominioId,
  unidadeId,
  localNome,
  onVoltar,
}: Props) {
  const [
    comunicados,
    setComunicados,
  ] =
    useState<
      ComunicadoMorador[]
    >([]);

  const [
    comunicadoAberto,
    setComunicadoAberto,
  ] =
    useState<
      ComunicadoMorador | null
    >(null);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    salvandoCiencia,
    setSalvandoCiencia,
  ] =
    useState(false);

  const searchParams =
    useSearchParams();

  const comunicadoIdPeloLink =
    searchParams.get(
      "comunicado"
    ) ||
    "";

  const caminhoComunicados =
    `comunicados-v2/${condominioId}`;

  useEffect(
    () => {
      if (
        !condominioId ||
        !unidadeId
      ) {
        setComunicados(
          []
        );

        setCarregando(
          false
        );

        return;
      }

      setCarregando(
        true
      );

      const referencia =
        ref(
          db,
          caminhoComunicados
        );

      const parar =
        onValue(
          referencia,
          (
            snapshot
          ) => {
            const dados =
              snapshot.val();

            if (!dados) {
              setComunicados(
                []
              );

              setCarregando(
                false
              );

              return;
            }

            const agora =
              Date.now();

            const lista =
              Object.entries(
                dados
              )
                .map(
                  ([
                    id,
                    valor,
                  ]) => ({
                    id,

                    ...(valor as Omit<
                      ComunicadoMorador,
                      "id"
                    >),
                  })
                )
                .filter(
                  (
                    comunicado
                  ) => {
                    const estaDisponivel =
                      comunicado.status ===
                        "enviado" ||
                      (
                        comunicado.status ===
                          "agendado" &&
                        comunicado.criadoEm <=
                          agora
                      );

                    if (
                      !estaDisponivel
                    ) {
                      return false;
                    }

                    /*
                     * Compatibilidade com comunicados
                     * antigos, anteriores à separação
                     * por público.
                     */
                    if (
                      !comunicado.destinatario
                    ) {
                      return true;
                    }

                    if (
                      comunicado.destinatario ===
                      "moradores"
                    ) {
                      return true;
                    }

                    if (
                      comunicado.destinatario ===
                      "unidade"
                    ) {
                      return (
                        comunicado.unidadeId ===
                          unidadeId ||
                        comunicado.unidadesDestinatarias
                          ?.includes(
                            unidadeId
                          ) === true
                      );
                    }

                    if (
                      comunicado.destinatario ===
                      "bloco"
                    ) {
                      return (
                        comunicado.unidadesDestinatarias
                          ?.includes(
                            unidadeId
                          ) === true
                      );
                    }

                    return false;
                  }
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    (b.criadoEm ||
                      0) -
                    (a.criadoEm ||
                      0)
                );

            setComunicados(
              lista
            );

            setCarregando(
              false
            );

            /*
             * Mantém o comunicado aberto sincronizado
             * quando a visualização/ciência muda
             * no Firebase.
             */
            setComunicadoAberto(
              (
                atual
              ) => {
                if (!atual) {
                  return null;
                }

                return (
                  lista.find(
                    (
                      item
                    ) =>
                      item.id ===
                      atual.id
                  ) ||
                  atual
                );
              }
            );
          }
        );

      return () =>
        parar();
    },
    [
      condominioId,
      unidadeId,
      caminhoComunicados,
    ]
  );

  useEffect(
  () => {
    if (
      !comunicadoIdPeloLink ||
      comunicadoAberto
    ) {
      return;
    }

    const comunicado =
      comunicados.find(
        (item) =>
          item.id ===
          comunicadoIdPeloLink
      );

    if (!comunicado) {
      return;
    }

    abrirComunicado(
      comunicado
    );
  },
  [
    comunicadoIdPeloLink,
    comunicados,
    comunicadoAberto,
  ]
);

async function abrirComunicado(
    comunicado:
      ComunicadoMorador
  ) {
    setComunicadoAberto(
      comunicado
    );

    const visualizacaoAtual =
      comunicado
        .visualizacoes?.[
          unidadeId
        ]
        ?.visualizadoEm;

    if (
      visualizacaoAtual
    ) {
      return;
    }

    try {
      await update(
        ref(
          db,
          `${caminhoComunicados}/${comunicado.id}/visualizacoes/${unidadeId}`
        ),
        {
          unidadeId,

          visualizadoEm:
            Date.now(),

          ciente:
            comunicado
              .visualizacoes?.[
                unidadeId
              ]
              ?.ciente ===
            true,
        }
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao registrar visualização do comunicado:",
        erro
      );
    }
  }

  async function confirmarCiencia() {
    if (
      !comunicadoAberto ||
      salvandoCiencia
    ) {
      return;
    }

    try {
      setSalvandoCiencia(
        true
      );

      const visualizacao =
        comunicadoAberto
          .visualizacoes?.[
            unidadeId
          ];

      await update(
        ref(
          db,
          `${caminhoComunicados}/${comunicadoAberto.id}/visualizacoes/${unidadeId}`
        ),
        {
          unidadeId,

          visualizadoEm:
            visualizacao
              ?.visualizadoEm ||
            Date.now(),

          ciente:
            true,

          cienteEm:
            Date.now(),
        }
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao registrar ciência:",
        erro
      );

      alert(
        "Não foi possível registrar sua ciência."
      );
    } finally {
      setSalvandoCiencia(
        false
      );
    }
  }

  const naoLidos =
    comunicados.filter(
      (
        comunicado
      ) =>
        !comunicado
          .visualizacoes?.[
            unidadeId
          ]
          ?.visualizadoEm
    ).length;

  if (
    carregando
  ) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        Carregando comunicados...
      </section>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
              Comunicados
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Avisos do condomínio
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {localNome ||
                "Seu condomínio"}
            </p>
          </div>

          {onVoltar && (
            <button
              type="button"
              onClick={
                onVoltar
              }
              className="rounded-2xl border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-700"
            >
              ← Voltar
            </button>
          )}

        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">
              Total
            </p>

            <p className="mt-1 text-xl font-black text-white">
              {
                comunicados.length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-orange-900 bg-orange-950/30 px-4 py-3">
            <p className="text-xs font-bold uppercase text-orange-400">
              Não lidos
            </p>

            <p className="mt-1 text-xl font-black text-orange-200">
              {
                naoLidos
              }
            </p>
          </div>
        </div>

        {comunicados.length ===
        0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
            <div className="text-4xl">
              📭
            </div>

            <p className="mt-3 font-black text-white">
              Nenhum comunicado
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Os comunicados enviados para sua unidade aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {comunicados.map(
              (
                comunicado
              ) => {
                const visualizacao =
                  comunicado
                    .visualizacoes?.[
                      unidadeId
                    ];

                const ciente =
                  visualizacao
                    ?.ciente ===
                  true;

                const lido =
                  Boolean(
                    visualizacao
                      ?.visualizadoEm
                  );

                return (
                  <button
                    key={
                      comunicado.id
                    }
                    type="button"
                    onClick={() =>
                      void abrirComunicado(
                        comunicado
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-cyan-600 hover:bg-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-white">
                        {iconeTipo(
                          comunicado.tipo
                        )}{" "}
                        {
                          comunicado.titulo
                        }
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                        {
                          comunicado.mensagem
                        }
                      </p>

                      <p className="mt-2 text-xs text-slate-600">
                        {
                          comunicado.criadoEmFormatado
                        }
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full px-3 py-1 text-[10px] font-black",
                        ciente
                          ? "bg-green-950 text-green-300"
                          : lido
                            ? "bg-blue-950 text-blue-300"
                            : "bg-orange-950 text-orange-300",
                      ].join(
                        " "
                      )}
                    >
                      {ciente
                        ? "CIENTE"
                        : lido
                          ? "LIDO"
                          : "LER"}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        )}
      </section>

      {comunicadoAberto &&
        (() => {
          const detalhes =
            comunicadoAberto
              .detalhesModelo ||
            {};

          const ehEmergencia =
            comunicadoAberto.tipo ===
            "emergencia";

          const precisaCiencia =
            comunicadoAberto
              .exigeCiencia !==
              false &&
            comunicadoAberto
              .exigirCiencia !==
              false;

          const ciente =
            comunicadoAberto
              .visualizacoes?.[
                unidadeId
              ]
              ?.ciente ===
            true;

          const temInformacoesRapidas =
            Boolean(
              detalhes.dataEvento
            ) ||
            Boolean(
              detalhes.horarioEvento
            ) ||
            Boolean(
              detalhes.localEvento
            ) ||
            Boolean(
              detalhes.empresaResponsavel
            );

          return (
            <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-black/90 p-4">

              <div
                className={[
                  "my-4 w-full max-w-lg overflow-hidden rounded-3xl border-2 bg-slate-900 shadow-2xl",
                  ehEmergencia
                    ? "border-red-500"
                    : "border-blue-500",
                ].join(
                  " "
                )}
              >
                <div
                  className={[
                    "p-5",
                    ehEmergencia
                      ? "bg-gradient-to-r from-red-950 to-slate-900"
                      : "bg-gradient-to-r from-blue-950 to-slate-900",
                  ].join(
                    " "
                  )}
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p
                        className={[
                          "text-xs font-black",
                          ehEmergencia
                            ? "text-red-300"
                            : "text-blue-300",
                        ].join(
                          " "
                        )}
                      >
                        {iconeTipo(
                          comunicadoAberto.tipo
                        )}{" "}
                        {textoTipo(
                          comunicadoAberto.tipo
                        )}
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-white">
                        {
                          comunicadoAberto.titulo
                        }
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {
                          comunicadoAberto.condominioNome
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setComunicadoAberto(
                          null
                        )
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-black text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-5">

                  {temInformacoesRapidas && (
                    <div className="grid gap-2 sm:grid-cols-2">

                      {detalhes.dataEvento && (
                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">
                            Data
                          </p>

                          <p className="mt-1 font-black text-white">
                            {formatarData(
                              detalhes.dataEvento
                            )}
                          </p>
                        </div>
                      )}

                      {detalhes.horarioEvento && (
                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">
                            Horário
                          </p>

                          <p className="mt-1 font-black text-white">
                            {
                              detalhes.horarioEvento
                            }
                          </p>
                        </div>
                      )}

                      {detalhes.localEvento && (
                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">
                            Local
                          </p>

                          <p className="mt-1 font-black text-white">
                            {
                              detalhes.localEvento
                            }
                          </p>
                        </div>
                      )}

                      {detalhes.empresaResponsavel && (
                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">
                            Responsável
                          </p>

                          <p className="mt-1 font-black text-white">
                            {
                              detalhes.empresaResponsavel
                            }
                          </p>
                        </div>
                      )}

                    </div>
                  )}

                  <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                      {
                        comunicadoAberto.mensagem
                      }
                    </p>
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    Enviado em{" "}
                    {
                      comunicadoAberto.criadoEmFormatado
                    }
                  </p>

                  {precisaCiencia ? (
                    ciente ? (
                      <div className="mt-5 rounded-xl border border-green-700 bg-green-950/30 p-4 text-center font-black text-green-300">
                        ✅ Ciente registrado
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          confirmarCiencia
                        }
                        disabled={
                          salvandoCiencia
                        }
                        className={[
                          "mt-5 w-full rounded-2xl py-4 text-lg font-black text-white disabled:bg-slate-600",
                          ehEmergencia
                            ? "bg-red-600 hover:bg-red-500"
                            : "bg-green-600 hover:bg-green-500",
                        ].join(
                          " "
                        )}
                      >
                        {salvandoCiencia
                          ? "Registrando..."
                          : ehEmergencia
                            ? "🚨 Confirmo que li e estou ciente"
                            : "✅ Li e estou ciente"}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setComunicadoAberto(
                          null
                        )
                      }
                      className="mt-5 w-full rounded-2xl bg-blue-600 py-4 font-black text-white hover:bg-blue-500"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}