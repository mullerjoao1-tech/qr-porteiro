"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
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
  const router = useRouter();

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

  const [respostasRapidasAbertas, setRespostasRapidasAbertas] =
    useState(true);

  /*
   * Audio QrCall novo.
   * Independente de qualquer logica antiga do Morador V2.
   */
  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const [gravandoAudio, setGravandoAudio] =
    useState(false);

  const [audioBlob, setAudioBlob] =
    useState<Blob | null>(null);

  const [avisoAudio, setAvisoAudio] =
    useState("");

  const [enviandoAudio, setEnviandoAudio] =
    useState(false);

  const [popupAudioAberto, setPopupAudioAberto] =
    useState(false);

  const [audioVisitanteRecebido, setAudioVisitanteRecebido] =
    useState("");

  const [audioVisitanteMensagemId, setAudioVisitanteMensagemId] =
    useState("");

  const [popupAudioVisitanteAberto, setPopupAudioVisitanteAberto] =
    useState(false);

  async function iniciarGravacaoAudio() {
    try {
      setAvisoAudio("");
      setAudioBlob(null);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder =
        new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable =
        (evento) => {
          if (
            evento.data &&
            evento.data.size > 0
          ) {
            audioChunksRef.current.push(
              evento.data
            );
          }
        };

      recorder.onstop = () => {
        const blob =
          new Blob(
            audioChunksRef.current,
            {
              type:
                recorder.mimeType ||
                "audio/webm",
            }
          );

        setAudioBlob(blob);
        setGravandoAudio(false);

        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        setAvisoAudio(
          "Áudio gravado. Confira antes de enviar."
        );
      };

      mediaRecorderRef.current =
        recorder;

      recorder.start();

      setGravandoAudio(true);

      setAvisoAudio(
        "Gravando áudio..."
      );

    } catch (erro) {
      console.error(
        "QRCALL_GRAVAR_AUDIO:",
        erro
      );

      setGravandoAudio(false);

      setAvisoAudio(
        "Não foi possível acessar o microfone."
      );
    }
  }

  useEffect(() => {
    if (!unidadeId) return;

    const referenciaMensagens =
      ref(
        db,
        `unidades-v2/${unidadeId}/chamada/mensagens`
      );

    const pararDeOuvir =
      onValue(
        referenciaMensagens,
        (snapshot) => {
          const dados = snapshot.val();

          if (!dados) {
            setAudioVisitanteRecebido("");
            return;
          }

          const mensagens =
            Object.entries(dados)
              .map(([id, valor]) => ({
                id,
                ...(valor as {
                  autor?: string;
                  tipo?: string;
                  audioBase64?: string;
                  criadoEm?: number;
                  audioOuvidoPeloMorador?: boolean;
                }),
              }))
              .filter(
                (item) =>
                  item.autor === "visitante" &&
                  item.tipo === "audio" &&
                  !!item.audioBase64 &&
                  item.audioOuvidoPeloMorador !== true
              )
              .sort(
                (a, b) =>
                  Number(a.criadoEm || 0) -
                  Number(b.criadoEm || 0)
              );

          const ultimoAudio =
            mensagens.length > 0
              ? mensagens[mensagens.length - 1]
              : null;

          if (
            ultimoAudio?.audioBase64 &&
            ultimoAudio?.id
          ) {
            setAudioVisitanteRecebido(
              ultimoAudio.audioBase64
            );

            setAudioVisitanteMensagemId(
              ultimoAudio.id
            );

            setPopupAudioVisitanteAberto(
              true
            );
          }
        }
      );

    return () => {
      pararDeOuvir();
    };

  }, [unidadeId]);

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
    <main
      id="qrcall-atendimento-pronto"
      className="min-h-screen bg-[#020617] text-white px-4 py-6"
    >
      {popupAudioVisitanteAberto &&
        audioVisitanteRecebido &&
        audioVisitanteMensagemId && (
        <div className="fixed inset-0 z-[1300] bg-black/95 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-4 border-blue-400 rounded-3xl p-5 text-center shadow-2xl">

            <p className="text-6xl mb-3">
              🎧
            </p>

            <h2 className="text-2xl font-black text-blue-300 mb-3">
              NOVO ÁUDIO
            </h2>

            <p className="text-slate-300 mb-5">
              Você recebeu um áudio do visitante.
            </p>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
              <audio
                controls
                autoPlay={false}
                className="w-full"
                src={audioVisitanteRecebido}
                onEnded={async () => {
                  const agora =
                    Date.now();

                  try {
                    await update(
                      ref(
                        db,
                        `unidades-v2/${unidadeId}/chamada/mensagens/${audioVisitanteMensagemId}`
                      ),
                      {
                        visualizadoPeloMorador: true,
                        visualizadoPeloMoradorEm: agora,
                        audioOuvidoPeloMorador: true,
                        audioOuvidoPeloMoradorEm: agora,
                      }
                    );

                    setPopupAudioVisitanteAberto(false);
                    setAudioVisitanteRecebido("");
                    setAudioVisitanteMensagemId("");

                  } catch (erro) {
                    console.error(
                      "QRCALL_AUDIO_VISITANTE_OUVIDO:",
                      erro
                    );
                  }
                }}
              />
            </div>

            <p className="text-yellow-300 text-sm font-bold mt-4">
              Ouça o áudio até o final para continuar.
            </p>

          </div>
        </div>
      )}

      {popupAudioAberto && (
        <div className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-3xl p-5 shadow-2xl">

            {!gravandoAudio && !enviandoAudio && (
              <button
                type="button"
                onClick={() => {
                  setAudioBlob(null);
                  setAvisoAudio("");
                  setPopupAudioAberto(false);
                }}
                className="absolute top-3 right-4 text-slate-400 hover:text-white text-3xl font-black"
              >
                ×
              </button>
            )}

            <div className="text-center mb-5">
              <div className="text-5xl mb-3">
                {gravandoAudio ? "🎙️" : "🎧"}
              </div>

              <h2 className="text-2xl font-black">
                {gravandoAudio
                  ? "GRAVANDO ÁUDIO"
                  : "ÁUDIO GRAVADO"}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {gravandoAudio
                  ? "Fale normalmente e toque em parar quando terminar."
                  : audioBlob
                  ? "Confira o áudio antes de enviar ao visitante."
                  : avisoAudio || "Preparando microfone..."}
              </p>
            </div>

            {gravandoAudio && (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 text-center">
                  <p className="text-red-400 font-black animate-pulse">
                    GRAVAÇÃO EM ANDAMENTO
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      mediaRecorderRef.current &&
                      mediaRecorderRef.current.state === "recording"
                    ) {
                      mediaRecorderRef.current.stop();
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  ⏹️ PARAR GRAVAÇÃO
                </button>
              </div>
            )}

            {!gravandoAudio && audioBlob && (
              <div className="space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3">
                  <audio
                    controls
                    className="w-full"
                    src={URL.createObjectURL(audioBlob)}
                  />
                </div>

                <button
                  type="button"
                  disabled={enviandoAudio}
                  onClick={async () => {
                    try {
                      setEnviandoAudio(true);
                      setAvisoAudio("Enviando áudio...");

                      const audioBase64 =
                        await new Promise<string>(
                          (resolve, reject) => {
                            const reader = new FileReader();

                            reader.onloadend = () => {
                              if (
                                typeof reader.result === "string"
                              ) {
                                resolve(reader.result);
                                return;
                              }

                              reject(
                                new Error(
                                  "Não foi possível converter o áudio."
                                )
                              );
                            };

                            reader.onerror = () => {
                              reject(
                                new Error(
                                  "Erro ao ler o áudio gravado."
                                )
                              );
                            };

                            reader.readAsDataURL(audioBlob);
                          }
                        );

                      const resposta =
                        await fetch(
                          "/api/qrcall/audio",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type":
                                "application/json",
                            },
                            body: JSON.stringify({
                              unidadeId,
                              audioBase64,
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
                          "Não foi possível enviar o áudio."
                        );
                      }

                      setAudioBlob(null);
                      setPopupAudioAberto(false);
                      setAvisoAudio("✓ Áudio enviado");

                      setTimeout(() => {
                        setAvisoAudio("");
                      }, 1800);

                    } catch (erro) {
                      console.error(
                        "QRCALL_ENVIAR_AUDIO:",
                        erro
                      );

                      setAvisoAudio(
                        erro instanceof Error
                          ? erro.message
                          : "Erro ao enviar áudio."
                      );

                    } finally {
                      setEnviandoAudio(false);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xl font-black py-4 rounded-2xl"
                >
                  {enviandoAudio
                    ? "Enviando..."
                    : "📤 ENVIAR ÁUDIO"}
                </button>

                {!enviandoAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setAudioBlob(null);
                      void iniciarGravacaoAudio();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-2xl"
                  >
                    🔄 GRAVAR NOVAMENTE
                  </button>
                )}

                {avisoAudio && (
                  <p className="text-center text-cyan-300 font-bold">
                    {avisoAudio}
                  </p>
                )}
              </div>
            )}

            {!gravandoAudio && !audioBlob && avisoAudio && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
                <p className="text-slate-300 font-bold">
                  {avisoAudio}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void iniciarGravacaoAudio();
                  }}
                  className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-black"
                >
                  🎙️ TENTAR NOVAMENTE
                </button>
              </div>
            )}

          </div>
        </div>
      )}

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

            {respostasRapidasAbertas ? (
              <div className="mt-5 bg-[#111827] border border-slate-700 rounded-3xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-blue-300 text-xl font-black">
                    💬 Respostas rápidas
                  </h3>

                  <button
                    type="button"
                    onClick={() => setRespostasRapidasAbertas(false)}
                    className="text-slate-400 text-sm font-black hover:text-white"
                  >
                    RECOLHER
                  </button>
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

                        setRespostasRapidasAbertas(false);

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
            ) : (
              <button
                type="button"
                onClick={() => setRespostasRapidasAbertas(true)}
                className="w-full mt-5 bg-slate-900 hover:bg-slate-800 border border-blue-500/40 text-blue-300 font-black py-3 rounded-2xl"
              >
                💬 RESPOSTAS RÁPIDAS
              </button>
            )}


            <button
              type="button"
              onClick={() => {
                setPopupAudioAberto(true);
                void iniciarGravacaoAudio();
              }}
              className="w-full mt-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl py-3 text-lg font-black"
            >
              🎙️ GRAVAR ÁUDIO
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const resposta =
                    await fetch(
                      "/api/qrcall/finalizar",
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
                      "Não foi possível finalizar o atendimento."
                    );
                  }

                  router.replace(
                    "/dashboard/morador"
                  );

                } catch (erro) {
                  console.error(
                    "QRCALL_FINALIZAR:",
                    erro
                  );

                  alert(
                    erro instanceof Error
                      ? erro.message
                      : "Erro ao finalizar atendimento."
                  );
                }
              }}
              className="w-full mt-5 bg-red-600 hover:bg-red-500 rounded-2xl py-4 text-xl font-black"
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