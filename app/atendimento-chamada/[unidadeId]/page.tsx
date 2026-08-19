"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

const respostasRapidas = [
  "💬 Aguarde um momento",
  "🚶 Já estou descendo",
  "📦 Pode deixar na portaria",
  "🏠 Não estou em casa",
  "🚶 Estou indo retirar",
];

export default function AtendimentoChamada() {
  const params = useParams();
  const searchParams = useSearchParams();

  const unidadeId = String(
    params?.unidadeId || ""
  );

  const iniciar =
    searchParams.get("iniciar") === "1";

  const inicioExecutadoRef =
    useRef(false);

  const [iniciando, setIniciando] =
    useState(iniciar);

  const [erroInicio, setErroInicio] =
    useState("");

  const [avisoResposta, setAvisoResposta] =
    useState("");

  useEffect(() => {
    if (!iniciar) {
      setIniciando(false);
      return;
    }

    if (inicioExecutadoRef.current) {
      return;
    }

    if (!unidadeId) {
      setErroInicio(
        "Unidade não identificada."
      );

      setIniciando(false);
      return;
    }

    inicioExecutadoRef.current = true;

    async function iniciarAtendimento() {
      try {
        const resposta =
          await fetch(
            "/api/qrcall/atender",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  unidadeId,
                }),
            }
          );

        const dados =
          await resposta
            .json()
            .catch(() => null);

        if (
          !resposta.ok ||
          !dados?.sucesso
        ) {
          throw new Error(
            dados?.erro ||
            "Não foi possível iniciar o atendimento."
          );
        }

        /*
         * Remove ?iniciar=1 depois da confirmação.
         * Assim refresh não tenta atender novamente.
         */
        if (
          typeof window !==
          "undefined"
        ) {
          const url =
            new URL(
              window.location.href
            );

          url.searchParams.delete(
            "iniciar"
          );

          window.history.replaceState(
            {},
            "",
            url.pathname +
              url.search +
              url.hash
          );
        }

        setIniciando(false);

      } catch (erro) {
        console.error(
          "QRCALL_INICIAR_ATENDIMENTO:",
          erro
        );

        setErroInicio(
          erro instanceof Error
            ? erro.message
            : "Erro ao iniciar atendimento."
        );

        setIniciando(false);
      }
    }

    void iniciarAtendimento();

  }, [
    iniciar,
    unidadeId,
  ]);

  if (iniciando) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-green-400 text-2xl font-black">
            QR ACESSO
          </p>

          <p className="text-slate-300 mt-4 font-bold">
            Iniciando atendimento...
          </p>
        </div>
      </main>
    );
  }

  if (erroInicio) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 text-center">
          <p className="text-red-400 text-xl font-black">
            Não foi possível atender
          </p>

          <p className="text-slate-300 mt-4">
            {erroInicio}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white px-4 py-6">
      <section className="w-full max-w-xl mx-auto">
        <div className="bg-[#0F172A] border border-slate-700 rounded-[32px] p-5">

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">
                🏠 Müller
              </h1>

              <p className="text-slate-400 text-lg mt-1">
                Casa Principal
              </p>
            </div>

            <div className="border border-green-500/50 rounded-2xl px-4 py-3 text-green-400 font-black">
              🟢 Disponível
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              type="button"
              className="bg-slate-800 border border-slate-600 rounded-2xl py-4 font-black text-slate-300"
            >
              🔒 Câmera
            </button>

            <button
              type="button"
              className="bg-slate-800 border border-slate-600 rounded-2xl py-4 font-black text-slate-300"
            >
              🔒 Abrir portão
            </button>
          </div>

          <div className="mt-8 bg-slate-800 border border-green-500/20 rounded-3xl p-5">
            <h2 className="text-green-400 text-2xl font-black">
              🔔 Entrega de comida
            </h2>

            <div className="mt-5 bg-[#111827] border border-slate-700 rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-blue-300 text-xl font-black">
                  💬 Respostas rápidas
                </h3>

                <span className="text-slate-400 text-sm font-black">
                  RECOLHER
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {respostasRapidas.map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={async () => {
                      try {
                        const mensagem =
                          texto.replace(
                            /^[^\p{L}\p{N}]+/u,
                            ""
                          );

                        const resposta =
                          await fetch(
                            "/api/qrcall/resposta-rapida",
                            {
                              method: "POST",

                              headers: {
                                "Content-Type":
                                  "application/json",
                              },

                              body:
                                JSON.stringify({
                                  unidadeId,
                                  mensagem,
                                }),
                            }
                          );

                        const dados =
                          await resposta
                            .json()
                            .catch(() => null);

                        if (
                          !resposta.ok ||
                          !dados?.sucesso
                        ) {
                          throw new Error(
                            dados?.erro ||
                            "Não foi possível enviar a resposta."
                          );
                        }

                        setAvisoResposta(
                          "✓ Resposta enviada"
                        );

                        setTimeout(() => {
                          setAvisoResposta("");
                        }, 1800);

                      } catch (erro) {
                        console.error(
                          "QRCALL_RESPOSTA_RAPIDA:",
                          erro
                        );

                        setAvisoResposta(
                          erro instanceof Error
                            ? erro.message
                            : "Erro ao enviar resposta."
                        );

                        setTimeout(() => {
                          setAvisoResposta("");
                        }, 2500);
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 rounded-2xl py-4 px-4 text-lg font-black"
                  >
                    {texto}
                  </button>
                ))}

                {avisoResposta && (
                  <p className="text-center text-green-400 font-bold mt-3">
                    {avisoResposta}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="w-full mt-5 bg-cyan-600 rounded-2xl py-4 text-xl font-black"
            >
              🎙️ GRAVAR ÁUDIO
            </button>

            <button
              type="button"
              className="w-full mt-5 bg-red-600 rounded-2xl py-4 text-xl font-black"
            >
              ❌ FINALIZAR ATENDIMENTO
            </button>
          </div>

          <p className="text-center text-slate-500 text-xs mt-4">
            Unidade: {unidadeId}
          </p>

        </div>
      </section>
    </main>
  );
}