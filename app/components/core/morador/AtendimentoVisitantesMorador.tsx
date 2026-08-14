"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";

import {
  listarResponsaveisDaUnidade,
  recusarEEncaminhar,
  registrarAtendimentoDoResponsavel,
} from "@/app/services/chamadas/MotorEscalonamento";

type MensagemConversa = {
  id?: string;

  autor:
    | "visitante"
    | "morador";

  tipo:
    | "texto"
    | "audio";

  texto?: string;

  audioBase64?: string;

  criadoEm: number;
};

type Props = {
  unidadeId: string;

  onVoltar?: () => void;
};

function blobParaBase64(
  blob: Blob
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onloadend =
        () =>
          resolve(
            reader.result as string
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        blob
      );
    }
  );
}

function ordenarMensagens(
  mensagens?: Record<
    string,
    MensagemConversa
  >
) {
  if (!mensagens) {
    return [];
  }

  return Object.entries(
    mensagens
  )
    .map(
      ([
        id,
        mensagem,
      ]) => ({
        id,
        ...mensagem,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        (a.criadoEm || 0) -
        (b.criadoEm || 0)
    );
}

export default function AtendimentoVisitantesMorador({
  unidadeId,
  onVoltar,
}: Props) {
  const [
    nome,
    setNome,
  ] =
    useState(
      "Nenhuma solicitação"
    );

  const [
    motivo,
    setMotivo,
  ] =
    useState(
      "Aguardando visitante"
    );

  const [
    status,
    setStatus,
  ] =
    useState(
      "Sem chamado ativo"
    );

  const [
    horaChamada,
    setHoraChamada,
  ] =
    useState("");

  const [
    mensagemResponsavel,
    setMensagemResponsavel,
  ] =
    useState("");

  const [
    mensagensConversa,
    setMensagensConversa,
  ] =
    useState<
      MensagemConversa[]
    >([]);

  const [
    visitanteVisualizou,
    setVisitanteVisualizou,
  ] =
    useState(false);

  const [
    audioVisitante,
    setAudioVisitante,
  ] =
    useState("");

  const [
    audioRespostaBlob,
    setAudioRespostaBlob,
  ] =
    useState<
      Blob | null
    >(null);

  const [
    gravandoAudio,
    setGravandoAudio,
  ] =
    useState(false);

  const [
    enviandoAudio,
    setEnviandoAudio,
  ] =
    useState(false);

  const [
    fotoCamera,
    setFotoCamera,
  ] =
    useState("");

  const [
    fotoAtualizadaEm,
    setFotoAtualizadaEm,
  ] =
    useState(
      Date.now()
    );

  const [
    capturandoCamera,
    setCapturandoCamera,
  ] =
    useState(false);

  const [
    popupAberto,
    setPopupAberto,
  ] =
    useState(false);

  const [
    aviso,
    setAviso,
  ] =
    useState("");

  const [
    textoLivre,
    setTextoLivre,
  ] =
    useState("");

  const intervaloSomRef =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  const finalizacaoRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const audioContextRef =
    useRef<
      AudioContext | null
    >(null);

  const mediaRecorderRef =
    useRef<
      MediaRecorder | null
    >(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const ultimaChamadaRef =
    useRef("");

  const ultimaChamadaDadosRef =
    useRef<any>(null);

  const chamadaEstavaAtivaRef =
    useRef(false);

  const caminhoChamada =
    `unidades-v2/${unidadeId}/chamada`;

  const caminhoHistorico =
    `historico-v2/${unidadeId}`;

  const caminhoLogs =
    `logs-v2/${unidadeId}`;

  const caminhoAnalytics =
    `analytics-v2/${unidadeId}`;

  const TEMPO_AGUARDANDO =
    2 * 60 * 1000;

  const TEMPO_ATENDIMENTO =
    1 * 60 * 1000;

  const chamadaAtiva =
    nome !==
      "Nenhuma solicitação" &&
    status !==
      "Sem chamado ativo" &&
    status !==
      "Encerrado";

  function tocarBip() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as any
        ).webkitAudioContext;

      if (
        !audioContextRef.current
      ) {
        audioContextRef.current =
          new AudioContextClass();
      }

      const contexto =
        audioContextRef.current;

      if (
        contexto.state ===
        "suspended"
      ) {
        void contexto.resume();
      }

      const oscillator =
        contexto.createOscillator();

      const gain =
        contexto.createGain();

      oscillator.connect(
        gain
      );

      gain.connect(
        contexto.destination
      );

      oscillator.frequency.value =
        880;

      oscillator.type =
        "sine";

      gain.gain.setValueAtTime(
        0.35,
        contexto.currentTime
      );

      gain.gain
        .exponentialRampToValueAtTime(
          0.01,
          contexto.currentTime +
            0.45
        );

      oscillator.start();

      oscillator.stop(
        contexto.currentTime +
          0.45
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao tocar alerta:",
        erro
      );
    }
  }

  function iniciarToque() {
    if (
      intervaloSomRef.current
    ) {
      return;
    }

    tocarBip();

    intervaloSomRef.current =
      setInterval(
        tocarBip,
        900
      );
  }

  function pararToque() {
    if (
      intervaloSomRef.current
    ) {
      clearInterval(
        intervaloSomRef.current
      );

      intervaloSomRef.current =
        null;
    }
  }

  function limparFinalizacao() {
    if (
      finalizacaoRef.current
    ) {
      clearTimeout(
        finalizacaoRef.current
      );

      finalizacaoRef.current =
        null;
    }
  }

  async function registrarLog(
    tipo: string,
    detalhes: string
  ) {
    try {
      const novo =
        push(
          ref(
            db,
            caminhoLogs
          )
        );

      await set(
        novo,
        {
          tipo,

          detalhes,

          unidade:
            unidadeId,

          timestamp:
            new Date()
              .toISOString(),

          nomeAtual:
            nome,

          statusAtual:
            status,

          navegador:
            typeof navigator !==
            "undefined"
              ? navigator
                  .userAgent
              : "indisponivel",
        }
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao registrar log:",
        erro
      );
    }
  }

  async function registrarAnalytics(
    evento: string
  ) {
    try {
      const referencia =
        ref(
          db,
          caminhoAnalytics
        );

      const snapshot =
        await get(
          referencia
        );

      const dados =
        snapshot.val() || {
          recebidas: 0,
          atendidas: 0,
          finalizadas: 0,
          timeouts: 0,
          falhas: 0,
        };

      if (
        evento ===
        "recebida"
      ) {
        dados.recebidas++;
      }

      if (
        evento ===
        "atendida"
      ) {
        dados.atendidas++;
      }

      if (
        evento ===
        "finalizada"
      ) {
        dados.finalizadas++;
      }

      if (
        evento ===
        "timeout"
      ) {
        dados.timeouts++;
      }

      if (
        evento ===
        "falha"
      ) {
        dados.falhas++;
      }

      await update(
        referencia,
        dados
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro analytics:",
        erro
      );
    }
  }

  async function salvarHistoricoComDados(
    tipoFinalizacao: string,
    dados: any
  ) {
    if (
      !dados ||
      !dados.nome
    ) {
      return;
    }

    const agora =
      new Date();

    await set(
      push(
        ref(
          db,
          caminhoHistorico
        )
      ),
      {
        nome:
          dados.nome ||
          "Visitante",

        motivo:
          dados.motivo ||
          "Não informado",

        modo:
          dados.modo ||
          "",

        statusFinal:
          dados.status ||
          "Sem status",

        tipoFinalizacao,

        chamadoEm:
          dados.criadoEm
            ? new Date(
                dados.criadoEm
              ).toLocaleString(
                "pt-BR"
              )
            : "",

        finalizadoEm:
          agora.toISOString(),

        finalizadoEmFormatado:
          agora.toLocaleString(
            "pt-BR"
          ),

        fotoCamera:
          fotoCamera ||
          "",
      }
    );
  }

  async function capturarFotoCamera() {
    if (
      capturandoCamera
    ) {
      return;
    }

    try {
      setCapturandoCamera(
        true
      );

      const resposta =
        await fetch(
          `/api/capturar-camera?cache=${Date.now()}`
        );

      const dados =
        await resposta.json();

      if (
        dados.sucesso &&
        dados.imagem
      ) {
        setFotoCamera(
          dados.imagem
        );

        setFotoAtualizadaEm(
          Date.now()
        );

        void registrarLog(
          "camera_sucesso",
          "Foto da câmera capturada."
        );
      }
    } catch (
      erro
    ) {
      console.error(
        "Erro câmera:",
        erro
      );

      void registrarLog(
        "erro_camera",
        String(
          erro
        )
      );
    } finally {
      setCapturandoCamera(
        false
      );
    }
  }

  async function finalizarAutomaticamente() {
    pararToque();

    limparFinalizacao();

    const dados =
      ultimaChamadaDadosRef.current;

    if (!dados) {
      return;
    }

    try {
      await update(
        ref(
          db,
          caminhoChamada
        ),
        {
          status:
            "Encerrado",

          mensagemResponsavel:
            "Tempo de atendimento encerrado.",

          notificar:
            false,

          encerradoEm:
            new Date()
              .toISOString(),
        }
      );

      await Promise.allSettled(
        [
          registrarAnalytics(
            "timeout"
          ),

          registrarLog(
            "timeout_atendimento",
            "Chamada finalizada automaticamente."
          ),

          salvarHistoricoComDados(
            status ===
              "Aguardando atendimento"
              ? "Não atendida"
              : "Automática",
            dados
          ),
        ]
      );

      setStatus(
        "Encerrado"
      );

      setPopupAberto(
        false
      );

      setAviso(
        "Atendimento encerrado."
      );

      const criadoEmEncerrado =
        dados.criadoEm;

      setTimeout(
        async () => {
          try {
            const snapshotAtual =
              await get(
                ref(
                  db,
                  caminhoChamada
                )
              );

            const chamadaAtual =
              snapshotAtual.val();

            if (
              chamadaAtual &&
              chamadaAtual.status ===
                "Encerrado" &&
              chamadaAtual.criadoEm ===
                criadoEmEncerrado
            ) {
              await remove(
                ref(
                  db,
                  caminhoChamada
                )
              );
            }
          } catch (erro) {
            console.error(
              "Erro ao limpar chamada encerrada:",
              erro
            );
          }
        },
        2000
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao finalizar automaticamente:",
        erro
      );
    }
  }

  function programarFinalizacao(
    dados: any
  ) {
    limparFinalizacao();

    if (
      dados.status ===
      "Encerrado"
    ) {
      return;
    }

    let limite =
      TEMPO_AGUARDANDO;

    let base =
      dados.criadoEm;

    if (
      dados.status ===
      "Em atendimento"
    ) {
      limite =
        TEMPO_ATENDIMENTO;

      base =
        dados.ultimaAtividade ||
        dados.atendidoEm ||
        dados.criadoEm;
    }

    if (!base) {
      return;
    }

    const inicio =
      new Date(
        base
      ).getTime();

    const restante =
      limite -
      (
        Date.now() -
        inicio
      );

    if (
      restante <= 0
    ) {
      void finalizarAutomaticamente();

      return;
    }

    setAviso(
      `Finalização automática em até ${Math.ceil(
        restante /
          60000
      )} min.`
    );

    finalizacaoRef.current =
      setTimeout(
        () => {
          void finalizarAutomaticamente();
        },
        restante
      );
  }

  useEffect(
    () => {
      if (
        !unidadeId
      ) {
        return;
      }

      const referencia =
        ref(
          db,
          caminhoChamada
        );

      const parar =
        onValue(
          referencia,
          async (
            snapshot
          ) => {
            const dados =
              snapshot.val();

            limparFinalizacao();

            if (!dados) {
              if (
                chamadaEstavaAtivaRef.current &&
                ultimaChamadaDadosRef.current
              ) {
                void registrarAnalytics(
                  "falha"
                );

                void salvarHistoricoComDados(
                  "Cancelada pelo visitante",
                  ultimaChamadaDadosRef.current
                );
              }

              chamadaEstavaAtivaRef.current =
                false;

              ultimaChamadaDadosRef.current =
                null;

              ultimaChamadaRef.current =
                "";

              setNome(
                "Nenhuma solicitação"
              );

              setMotivo(
                "Aguardando visitante"
              );

              setStatus(
                "Sem chamado ativo"
              );

              setHoraChamada(
                ""
              );

              setMensagemResponsavel(
                ""
              );

              setMensagensConversa(
                []
              );

              setAudioVisitante(
                ""
              );

              setAudioRespostaBlob(
                null
              );

              setVisitanteVisualizou(
                false
              );

              setPopupAberto(
                false
              );

              setAviso(
                ""
              );

              pararToque();

              return;
            }

            chamadaEstavaAtivaRef.current =
              true;

            ultimaChamadaDadosRef.current =
              dados;

            setNome(
              dados.nome ||
              "Visitante"
            );

            setMotivo(
              dados.motivo ||
              "Não informado"
            );

            setStatus(
              dados.status ||
              "Sem chamado ativo"
            );

            setHoraChamada(
              dados.criadoEm
                ? new Date(
                    dados.criadoEm
                  ).toLocaleString(
                    "pt-BR"
                  )
                : ""
            );

            setMensagemResponsavel(
              dados
                .mensagemResponsavel ||
              ""
            );

            setVisitanteVisualizou(
              dados.visitanteVisualizou ===
                true ||
              dados.mensagemVisualizada ===
                true ||
              dados.visualizadoPeloVisitante ===
                true
            );

            const mensagens =
              ordenarMensagens(
                dados.mensagens
              );

            setMensagensConversa(
              mensagens
            );

            const ultimoAudio =
              [
                ...mensagens,
              ]
                .reverse()
                .find(
                  (
                    item
                  ) =>
                    item.autor ===
                      "visitante" &&
                    item.tipo ===
                      "audio" &&
                    Boolean(
                      item.audioBase64
                    )
                );

            setAudioVisitante(
              ultimoAudio
                ?.audioBase64 ||
              dados.audioBase64 ||
              ""
            );

            const idChamada =
              String(
                dados.criadoEm ||
                dados.nome ||
                ""
              );

            if (
              idChamada &&
              ultimaChamadaRef.current !==
                idChamada
            ) {
              ultimaChamadaRef.current =
                idChamada;

              void registrarAnalytics(
                "recebida"
              );

              void registrarLog(
                "chamada_recebida",
                "Nova chamada recebida."
              );

              void capturarFotoCamera();
            }

            if (
              dados.notificar ===
                true &&
              dados.status ===
                "Aguardando atendimento"
            ) {
              iniciarToque();

              setPopupAberto(
                true
              );
            } else {
              pararToque();
            }

            programarFinalizacao(
              dados
            );
          }
        );

      return () => {
        parar();

        pararToque();

        limparFinalizacao();
      };
    },
    [
      unidadeId,
      caminhoChamada,
    ]
  );

  async function atenderSolicitacao() {
    if (
      status ===
      "Sem chamado ativo"
    ) {
      alert(
        "Não existe chamada ativa para atender."
      );

      return;
    }

    if (
      status ===
      "Em atendimento"
    ) {
      return;
    }

    pararToque();

    setPopupAberto(
      false
    );

    try {
      const snapshot =
        await get(
          ref(
            db,
            caminhoChamada
          )
        );

      const chamada =
        snapshot.val() ||
        {};

      const responsavelAtualId =
        String(
          chamada
            .responsavelAtualId ||
          ""
        );

      if (
        !responsavelAtualId
      ) {
        await update(
          ref(
            db,
            caminhoChamada
          ),
          {
            status:
              "Em atendimento",

            notificar:
              false,

            atendidoEm:
              new Date()
                .toISOString(),

            ultimaAtividade:
              Date.now(),
          }
        );
      } else {
        const responsaveis =
          await listarResponsaveisDaUnidade(
            unidadeId
          );

        const responsavel =
          responsaveis.find(
            (
              item
            ) =>
              item.id ===
              responsavelAtualId
          );

        if (
          !responsavel
        ) {
          throw new Error(
            "O responsável atual da chamada não foi encontrado."
          );
        }

        await registrarAtendimentoDoResponsavel(
          caminhoChamada,
          responsavel
        );
      }

      setStatus(
        "Em atendimento"
      );

      await Promise.allSettled(
        [
          registrarAnalytics(
            "atendida"
          ),

          registrarLog(
            "chamada_atendida",
            "Chamada atendida pelo morador."
          ),
        ]
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao atender:",
        erro
      );

      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível atender."
      );
    }
  }

  async function naoPossoAtender() {
    try {
      pararToque();

      const snapshot =
        await get(
          ref(
            db,
            caminhoChamada
          )
        );

      const chamada =
        snapshot.val() ||
        {};

      const responsavelAtualId =
        String(
          chamada
            .responsavelAtualId ||
          ""
        );

      if (
        !responsavelAtualId
      ) {
        alert(
          "A chamada ainda não possui responsável individual definido."
        );

        return;
      }

      const resultado =
        await recusarEEncaminhar(
          unidadeId,
          caminhoChamada,
          responsavelAtualId
        );

      await registrarLog(
        "chamada_recusada",
        `Responsável ${responsavelAtualId} não pode atender.`
      );

      if (
        resultado.sucesso &&
        resultado.responsavel
      ) {
        alert(
          `Chamada encaminhada para ${resultado.responsavel.nome}.`
        );

        return;
      }

      alert(
        resultado.motivo ||
        "Não existe outro responsável disponível."
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao encaminhar:",
        erro
      );

      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível encaminhar."
      );
    }
  }

  async function registrarMensagem(
    dados: Omit<
      MensagemConversa,
      "criadoEm"
    >
  ) {
    const id =
      String(
        Date.now()
      );

    await set(
      ref(
        db,
        `${caminhoChamada}/mensagens/${id}`
      ),
      {
        ...dados,

        criadoEm:
          Date.now(),
      }
    );

    await update(
      ref(
        db,
        caminhoChamada
      ),
      {
        ultimaAtividade:
          Date.now(),

        enviadoEm:
          Date.now(),
      }
    );
  }

  async function enviarMensagem(
    mensagem: string
  ) {
    const texto =
      mensagem.trim();

    if (!texto) {
      return;
    }

    if (
      status !==
      "Em atendimento"
    ) {
      alert(
        "Atenda a chamada antes de responder."
      );

      return;
    }

    await update(
      ref(
        db,
        caminhoChamada
      ),
      {
        status:
          "Em atendimento",

        mensagemResponsavel:
          texto,

        notificar:
          false,

        visitanteVisualizou:
          false,

        mensagemVisualizada:
          false,

        visualizadoPeloVisitante:
          false,

        enviadoEm:
          Date.now(),

        ultimaAtividade:
          Date.now(),
      }
    );

    await registrarMensagem({
      autor:
        "morador",

      tipo:
        "texto",

      texto,
    });

    setMensagemResponsavel(
      texto
    );

    setVisitanteVisualizou(
      false
    );

    setTextoLivre(
      ""
    );
  }

  async function iniciarGravacao() {
    if (
      status !==
      "Em atendimento"
    ) {
      alert(
        "Atenda a chamada antes de gravar."
      );

      return;
    }

    try {
      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true,
          });

      const recorder =
        new MediaRecorder(
          stream
        );

      audioChunksRef.current =
        [];

      recorder.ondataavailable =
        (
          evento
        ) => {
          if (
            evento.data.size >
            0
          ) {
            audioChunksRef.current.push(
              evento.data
            );
          }
        };

      recorder.onstop =
        () => {
          const tipo =
            recorder.mimeType ||
            audioChunksRef
              .current[0]
              ?.type ||
            "audio/webm";

          const blob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  tipo,
              }
            );

          setAudioRespostaBlob(
            blob
          );

          setGravandoAudio(
            false
          );

          stream
            .getTracks()
            .forEach(
              (
                track
              ) =>
                track.stop()
            );
        };

      mediaRecorderRef.current =
        recorder;

      recorder.start();

      setAudioRespostaBlob(
        null
      );

      setGravandoAudio(
        true
      );
    } catch (
      erro
    ) {
      console.error(
        erro
      );

      alert(
        "Não foi possível acessar o microfone."
      );
    }
  }

  function pararGravacao() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current
        .state ===
        "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }

  async function enviarAudio() {
    if (
      !audioRespostaBlob
    ) {
      return;
    }

    try {
      setEnviandoAudio(
        true
      );

      const base64 =
        await blobParaBase64(
          audioRespostaBlob
        );

      await update(
        ref(
          db,
          caminhoChamada
        ),
        {
          status:
            "Em atendimento",

          notificar:
            false,

          mensagemResponsavel:
            "",

          visitanteVisualizou:
            false,

          mensagemVisualizada:
            false,

          visualizadoPeloVisitante:
            false,

          ultimaAtividade:
            Date.now(),

          enviadoEm:
            Date.now(),
        }
      );

      await registrarMensagem({
        autor:
          "morador",

        tipo:
          "audio",

        audioBase64:
          base64,
      });

      setAudioRespostaBlob(
        null
      );
    } finally {
      setEnviandoAudio(
        false
      );
    }
  }

  async function finalizarAtendimento() {
    if (
      !chamadaAtiva
    ) {
      return;
    }

    pararToque();

    limparFinalizacao();

    try {
      await update(
        ref(
          db,
          caminhoChamada
        ),
        {
          status:
            "Encerrado",

          mensagemResponsavel:
            "ATENDIMENTO_ENCERRADO",

          notificar:
            false,

          encerradoEm:
            new Date()
              .toISOString(),
        }
      );

      await Promise.allSettled(
        [
          registrarAnalytics(
            "finalizada"
          ),

          registrarLog(
            "chamada_finalizada",
            "Chamada finalizada manualmente."
          ),

          salvarHistoricoComDados(
            "Manual",
            ultimaChamadaDadosRef.current
          ),
        ]
      );

      setStatus(
        "Encerrado"
      );

      setPopupAberto(
        false
      );

      const criadoEmEncerrado =
        ultimaChamadaDadosRef.current?.criadoEm;

      setTimeout(
        async () => {
          try {
            const snapshotAtual =
              await get(
                ref(
                  db,
                  caminhoChamada
                )
              );

            const chamadaAtual =
              snapshotAtual.val();

            if (
              chamadaAtual &&
              chamadaAtual.status ===
                "Encerrado" &&
              chamadaAtual.criadoEm ===
                criadoEmEncerrado
            ) {
              await remove(
                ref(
                  db,
                  caminhoChamada
                )
              );
            }
          } catch (erro) {
            console.error(
              "Erro ao limpar chamada encerrada:",
              erro
            );
          }
        },
        2000
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao finalizar:",
        erro
      );

      alert(
        "Não foi possível finalizar o atendimento."
      );
    }
  }

  if (
    !unidadeId
  ) {
    return (
      <div className="rounded-3xl border border-red-800 bg-red-950/30 p-6 text-red-200">
        Unidade não identificada.
      </div>
    );
  }

  return (
    <section className="space-y-5">

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
            Atendimento de visitantes
          </p>

          <h2 className="mt-1 text-2xl font-black text-white">
            {chamadaAtiva
              ? nome
              : "Nenhuma chamada ativa"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {chamadaAtiva
              ? motivo
              : "Quando alguém chamar sua unidade, o atendimento aparecerá aqui."}
          </p>
        </div>

        {onVoltar && (
          <button
            type="button"
            onClick={
              onVoltar
            }
            className="rounded-2xl border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
          >
            ← Voltar
          </button>
        )}
      </div>

      {chamadaAtiva && (
        <>
          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-3xl border border-blue-800 bg-blue-950/30 p-5">
              <p className="text-xs font-black uppercase text-blue-300">
                Status
              </p>

              <p className="mt-2 text-xl font-black text-white">
                {status}
              </p>

              {horaChamada && (
                <p className="mt-2 text-sm text-slate-400">
                  Chamada: {horaChamada}
                </p>
              )}

              {aviso && (
                <p className="mt-3 text-sm font-bold text-amber-300">
                  {aviso}
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5">
              <p className="text-xs font-black uppercase text-slate-400">
                Câmera
              </p>

              {fotoCamera ? (
                <img
                  src={`${fotoCamera}?t=${fotoAtualizadaEm}`}
                  alt="Câmera da entrada"
                  className="mt-3 w-full rounded-2xl border border-slate-700"
                />
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  {capturandoCamera
                    ? "Capturando imagem..."
                    : "Sem imagem disponível."}
                </p>
              )}
            </div>
          </div>

          {status ===
            "Aguardando atendimento" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  atenderSolicitacao
                }
                className="rounded-2xl bg-green-500 px-5 py-4 text-lg font-black text-slate-950 hover:bg-green-400"
              >
                ✅ Atender agora
              </button>

              <button
                type="button"
                onClick={
                  naoPossoAtender
                }
                className="rounded-2xl border border-amber-600 bg-amber-950/30 px-5 py-4 font-black text-amber-200 hover:bg-amber-950/50"
              >
                Não posso atender
              </button>
            </div>
          )}

          {status ===
            "Em atendimento" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

              <h3 className="text-lg font-black text-white">
                Conversa com o visitante
              </h3>

              <div className="mt-4 space-y-2">
                {mensagensConversa.map(
                  (
                    mensagem
                  ) => (
                    <div
                      key={
                        mensagem.id ||
                        mensagem.criadoEm
                      }
                      className={[
                        "rounded-2xl p-3 text-sm",
                        mensagem.autor ===
                        "morador"
                          ? "ml-8 bg-blue-950/60 text-blue-100"
                          : "mr-8 bg-slate-800 text-slate-100",
                      ].join(" ")}
                    >
                      {mensagem.tipo ===
                      "audio" ? (
                        <audio
                          controls
                          src={
                            mensagem.audioBase64
                          }
                          className="w-full"
                        />
                      ) : (
                        mensagem.texto
                      )}
                    </div>
                  )
                )}
              </div>

              {audioVisitante && (
                <div className="mt-4 rounded-2xl border border-violet-800 bg-violet-950/30 p-4">
                  <p className="mb-2 text-sm font-black text-violet-200">
                    Último áudio do visitante
                  </p>

                  <audio
                    controls
                    src={
                      audioVisitante
                    }
                    className="w-full"
                  />
                </div>
              )}

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  "Já vou atender.",
                  "Um momento, por favor.",
                  "Pode deixar na portaria.",
                ].map(
                  (
                    mensagem
                  ) => (
                    <button
                      key={
                        mensagem
                      }
                      type="button"
                      onClick={() =>
                        void enviarMensagem(
                          mensagem
                        )
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      {mensagem}
                    </button>
                  )
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={
                    textoLivre
                  }
                  onChange={
                    (
                      evento
                    ) =>
                      setTextoLivre(
                        evento.target.value
                      )
                  }
                  placeholder="Digite uma mensagem..."
                  className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    void enviarMensagem(
                      textoLivre
                    )
                  }
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                >
                  Enviar
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!gravandoAudio ? (
                  <button
                    type="button"
                    onClick={
                      iniciarGravacao
                    }
                    className="rounded-2xl border border-violet-700 bg-violet-950/30 px-4 py-3 font-black text-violet-200"
                  >
                    🎙️ Gravar áudio
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      pararGravacao
                    }
                    className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white"
                  >
                    ⏹ Parar gravação
                  </button>
                )}

                {audioRespostaBlob && (
                  <button
                    type="button"
                    disabled={
                      enviandoAudio
                    }
                    onClick={
                      enviarAudio
                    }
                    className="rounded-2xl bg-violet-600 px-4 py-3 font-black text-white disabled:opacity-60"
                  >
                    {enviandoAudio
                      ? "Enviando..."
                      : "Enviar áudio"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    finalizarAtendimento
                  }
                  className="ml-auto rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500"
                >
                  Finalizar atendimento
                </button>
              </div>

              {mensagemResponsavel && (
                <p className="mt-4 text-sm text-slate-400">
                  Última resposta:{" "}
                  <strong className="text-white">
                    {mensagemResponsavel}
                  </strong>

                  {visitanteVisualizou &&
                    " • Visitante visualizou"}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {popupAberto &&
        status ===
          "Aguardando atendimento" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-green-600 bg-slate-950 p-6 shadow-2xl">
              <p className="text-sm font-black uppercase text-green-400">
                Nova chamada
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {nome}
              </h2>

              <p className="mt-2 text-slate-300">
                {motivo}
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={
                    atenderSolicitacao
                  }
                  className="rounded-2xl bg-green-500 py-4 text-lg font-black text-black"
                >
                  ✅ Atender agora
                </button>

                <button
                  type="button"
                  onClick={
                    naoPossoAtender
                  }
                  className="rounded-2xl border border-amber-700 bg-amber-950/30 py-4 font-black text-amber-200"
                >
                  Não posso atender
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}


