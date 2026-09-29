"use client";

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

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
  get,
  onValue,
  ref,
  update,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";
import {
  QrCallLiveController,
} from "@/app/services/qrcall-live/QrCallLiveController";

import {
  useLocalAtual,
} from "@/app/hooks/useLocalAtual";

const respostasRapidas = [
  "\u{1F4AC} Aguarde um momento",
  "\u{1F6B6} J\u00e1 estou descendo",
  "\u{1F4E6} Pode deixar na portaria",
  "\u{1F3E0} N\u00e3o estou em casa",
  "\u{1F6B6} Estou indo retirar",
];

// QRCALL_NATIVE_PLUGIN_REGISTERED
type QrCallLiveNativePlugin = {
  iniciar(options: {
    unidadeId: string;
    criadoEm: string;
  }): Promise<void>;

  encerrar(): Promise<void>;
};

const QrCallLiveNative =
  registerPlugin<QrCallLiveNativePlugin>(
    "QrCallLive"
  );
export default function AtendimentoChamada() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const unidadeId = String(
    params?.unidadeId || ""
  );

  const {
    localNome,
    unidade,
  } = useLocalAtual(unidadeId);

  const iniciar =
    searchParams.get("iniciar") === "1";

  // QRCALL_A9_10_ENTRADA_VIDEO_NATIVA
  // O balao nativo ja foi o aceite definitivo.
  const entradaVideoNativa =
    iniciar &&
    searchParams.get("video") === "1";
  // QRCALL_AUDIO_DIRETO_V2_ENTRADA
  const entradaAudioNativa =
    iniciar &&
    searchParams.get("audio") === "1";

  const inicioExecutadoRef =
    useRef(false);

  const [iniciando, setIniciando] =
    useState(iniciar);

  const [erroInicio, setErroInicio] =
    useState("");

  const [
    criadoEmChamada,
    setCriadoEmChamada,
  ] = useState("");

  const [
    responsavelUidChamada,
    setResponsavelUidChamada,
  ] = useState("");

  const [avisoResposta, setAvisoResposta] =
    useState("");

  const [respostasRapidasAbertas, setRespostasRapidasAbertas] =
    useState(true);
  // QRCALL_AUDIO_CONVITE_MORADOR
  const [
    liveConviteVisitante,
    setLiveConviteVisitante,
  ] = useState<{
    unidadeId: string;
    criadoEm: string;
    tipo: "audio" | "video";
  } | null>(null);

  // QrCall Live - independente do audio gravado.
  const liveControllerRef =
    useRef<QrCallLiveController | null>(null);

  const liveAudioRemotoRef =
    useRef<HTMLAudioElement | null>(null);

  const [liveEstado, setLiveEstado] =
    useState("");

  const [liveErro, setLiveErro] =
    useState("");

  // QRCALL_VIDEO_FLUXO_V7
  const [
    liveVideoEmCurso,
    setLiveVideoEmCurso,
  ] = useState(entradaVideoNativa);

  // QRCALL_FINALIZANDO_ATENDIMENTO_V4_20260914
  // Mantem o painel Web desmontado durante o encerramento.
  const [
    finalizandoAtendimento,
    setFinalizandoAtendimento,
  ] = useState(false);
async function iniciarLiveMorador(
    criadoEmLive: string,
    tipoLive: "audio" | "video" = "audio"
  ) {
    // QRCALL_LIVE_NATIVE_5C
    // No APK Android, o peer WebRTC pertence ao plugin nativo.
    if (
      typeof window !== "undefined" &&
      Capacitor.isNativePlatform()
    ) {
      try {
        await QrCallLiveNative.iniciar({
          unidadeId,
          criadoEm: criadoEmLive,
        });

        setLiveEstado("nativo_iniciado");
        setLiveErro("");

        return;
      } catch (erro) {
        console.error(
          "Falha ao iniciar QrCall Live nativo:",
          erro
        );

        setLiveErro(
          erro instanceof Error
            ? erro.message
            : "Falha ao iniciar Live nativo."
        );

        setLiveVideoEmCurso(false);

        return;
      }
    }

    if (
      liveControllerRef.current ||
      !unidadeId ||
      !criadoEmLive
    ) {
      return;
    }

    setLiveErro("");
    setLiveEstado("preparando");

    const controller =
      new QrCallLiveController({
        db,
        unidadeId,
        criadoEm: criadoEmLive,
        lado: "morador",
        // QRCALL_VIDEO_MORADOR_RECEBE_20260910
        tipo: tipoLive,

        onEstado: (estado) => {
          setLiveEstado(estado);
        },

        onRemoteStream: (stream) => {
          const player =
            liveAudioRemotoRef.current;

          if (!player) {
            return;
          }

          player.srcObject = stream;

          void player.play().catch(() => {
            // Pode exigir nova interacao do usuario.
          });
        },

        onErro: (erro) => {
          console.error(
            "QRCALL_LIVE_MORADOR:",
            erro
          );

          setLiveErro(
            erro.message
          );
        },
      });

    liveControllerRef.current =
      controller;

    try {
      await controller
        .iniciarComoMorador();

    } catch (erro) {
      try {
        await controller.encerrar();
      } catch {
        // Limpeza best-effort.
      }

      liveControllerRef.current =
        null;

      setLiveEstado("erro");

      setLiveErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao entrar no Live."
      );

      setLiveVideoEmCurso(false);
    }
  }

  async function encerrarLiveMorador() {
    // QRCALL_LIVE_NATIVE_5C_END
    if (
      typeof window !== "undefined" &&
      Capacitor.isNativePlatform()
    ) {
      try {
        await QrCallLiveNative.encerrar();
      } catch (erro) {
        console.error(
          "Falha ao encerrar QrCall Live nativo:",
          erro
        );
      }

      setLiveEstado("");
      setLiveErro("");
      setLiveVideoEmCurso(false);

      return;
    }

    const controller =
      liveControllerRef.current;

    liveControllerRef.current =
      null;

    if (controller) {
      await controller.encerrar();
    }

    if (liveAudioRemotoRef.current) {
      liveAudioRemotoRef.current.srcObject =
        null;
    }

    setLiveEstado("");
    setLiveVideoEmCurso(false);
  }

  // QRCALL_FINALIZAR_LIVE_FUNCAO_20260914
  async function finalizarAtendimentoAtual() {
    // QRCALL_FINALIZAR_SEM_PAINEL_V4_20260914
    setFinalizandoAtendimento(true);

    try {
      await encerrarLiveMorador();

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
            "N\u00e3o foi poss\u00edvel finalizar o atendimento."
        );
      }

      router.replace(
        "/dashboard/morador"
      );
    } catch (erro) {
      // QRCALL_FINALIZAR_ERRO_LIBERA_V4_20260914
      setFinalizandoAtendimento(false);

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
  }

  // QRCALL_FINALIZAR_LIVE_LISTENER_20260914
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !Capacitor.isNativePlatform()
    ) {
      return;
    }

    let ativo = true;
    let remover = null as null | (() => Promise<void>);

    void (async () => {
      try {
        const handle =
          await (QrCallLiveNative as any).addListener(
            "finalizarSolicitado",
            () => {
              void finalizarAtendimentoAtual();
            }
          );

        if (!ativo) {
          await handle.remove();
          return;
        }

        remover =
          async () => {
            await handle.remove();
          };
      } catch (erro) {
        console.error(
          "QRCALL_FINALIZAR_LISTENER:",
          erro
        );
      }
    })();

    return () => {
      ativo = false;
      if (remover) {
        void remover();
      }
    };
  }, [unidadeId]);
  useEffect(() => {
    return () => {
      const controller =
        liveControllerRef.current;

      liveControllerRef.current =
        null;

      if (controller) {
        void controller.encerrar();
      }
    };
  }, []);

  // QRCALL_A8_6B_RETORNO_PAINEL
  //
  // O Android A8.5 fecha renderer/WebRTC quando
  // a presenca do visitante desaparece.
  //
  // Este listener faz a outra metade:
  // retira a base preta do React e devolve
  // imediatamente o painel normal do atendimento.
  useEffect(() => {
    if (
      !liveVideoEmCurso ||
      !unidadeId ||
      !criadoEmChamada
    ) {
      return;
    }

    const criadoMs =
      Date.parse(
        criadoEmChamada
      );

    if (
      !Number.isFinite(
        criadoMs
      )
    ) {
      return;
    }

    const referenciaPresenca =
      ref(
        db,
        `qrcall-presenca/${unidadeId}/${String(criadoMs)}`
      );

    let presencaFoiVista =
      false;

    const pararPresenca =
      onValue(
        referenciaPresenca,
        (snapshot) => {

          /*
           * Primeiro confirmamos a presenca real.
           * Assim um null inicial nunca derruba
           * uma chamada valida.
           */
          if (snapshot.exists()) {
            presencaFoiVista =
              true;

            return;
          }

          if (!presencaFoiVista) {
            return;
          }

          console.log(
            "QRCALL_A8_6B_VISITANTE_ABANDONOU"
          );

          /*
           * O renderer nativo ja esta sendo fechado
           * pelo A8.5. Aqui limpamos somente os
           * estados visuais da pagina.
           */
          setLiveVideoEmCurso(
            false
          );

          setLiveEstado(
            ""
          );

          setLiveErro(
            ""
          );

          setLiveConviteVisitante(
            null
          );
          // QRCALL_A8_8C_ABANDONO_ENCERRA
          //
          // Fechar/abandonar a pagina do visitante
          // significa encerrar a conversa inteira.
          void (async () => {
            try {
              const resposta =
                await fetch(
                  "/api/qrcall/cancelar-visitante",
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body:
                      JSON.stringify({
                        unidadeId,
                        criadoEmEsperado:
                          criadoEmChamada,
                      }),
                  }
                );

              if (
                !resposta.ok &&
                resposta.status !== 409
              ) {
                console.warn(
                  "QRCALL_A8_8C_CANCELAMENTO",
                  resposta.status
                );
              }
            } catch (erro) {
              console.warn(
                "QRCALL_A8_8C_FALHA_CANCELAMENTO",
                erro
              );
            }

            router.replace(
              "/dashboard/morador"
            );
          })();
        }
      );

    return () => {
      pararPresenca();
    };
  }, [
    liveVideoEmCurso,
    unidadeId,
    criadoEmChamada,
  ]);

  useEffect(() => {
    if (!unidadeId) {
      return;
    }

    const referenciaChamada =
      ref(
        db,
        `unidades-v2/${unidadeId}/chamada`
      );

    const pararDeOuvir =
      onValue(
        referenciaChamada,
        (snapshot) => {
          if (!snapshot.exists()) {
            router.replace(
              "/dashboard/morador"
            );
            return;
          }

          const chamadaAtual =
            snapshot.val() || {};

          setCriadoEmChamada(
            String(
              chamadaAtual.criadoEm || ""
            )
          );

          setResponsavelUidChamada(
            String(
              chamadaAtual.responsavelAtualUid || ""
            )
          );

          const statusAtual =
            String(
              chamadaAtual.status || ""
            );

          if (
            statusAtual === "Cancelado pelo visitante" ||
            statusAtual === "Cancelada pelo visitante"
          ) {
            router.replace(
              "/dashboard/morador"
            );
          }
        }
      );

    return () => {
      pararDeOuvir();
    };
  }, [unidadeId, router]);

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

  const [popupAudioRecebidoAberto, setPopupAudioRecebidoAberto] =
    useState(false);

  const [audioPopupRecebido, setAudioPopupRecebido] =
    useState("");

  const ultimoAudioPopupRef =
    useRef("");

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
          "\u00c1udio gravado. Confira antes de enviar."
        );
      };

      mediaRecorderRef.current =
        recorder;

      recorder.start();

      setGravandoAudio(true);

      setAvisoAudio(
        "Gravando \u00e1udio..."
      );

    } catch (erro) {
      console.error(
        "QRCALL_GRAVAR_AUDIO:",
        erro
      );

      setGravandoAudio(false);

      setAvisoAudio(
        "N\u00e3o foi poss\u00edvel acessar o microfone."
      );
    }
  }

  useEffect(() => {
    if (!unidadeId || !criadoEmChamada) {
      setAudioVisitanteRecebido("");
      setAudioPopupRecebido("");
      setPopupAudioRecebidoAberto(false);
      return;
    }

    const criadoEmChamadaMs =
      Date.parse(criadoEmChamada);

    if (!Number.isFinite(criadoEmChamadaMs)) {
      return;
    }

    /*
     * QRCALL_FIX_AUDIO_CHAMADA_ATUAL_20260914
     *
     * A arvore chamada/mensagens pode ainda conter mensagens
     * da chamada anterior.
     *
     * Portanto somente audios criados durante a chamada atual
     * podem aparecer no painel ou abrir o popup.
     */
    ultimoAudioPopupRef.current = "";

    setAudioVisitanteRecebido("");
    setAudioPopupRecebido("");
    setPopupAudioRecebidoAberto(false);

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
                }),
              }))
              .filter(
                (item) =>
                  item.autor === "visitante" &&
                  item.tipo === "audio" &&
                  !!item.audioBase64 &&
                  Number(item.criadoEm || 0) >=
                    criadoEmChamadaMs
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

          setAudioVisitanteRecebido(
            ultimoAudio?.audioBase64 || ""
          );

          if (
            ultimoAudio?.id &&
            ultimoAudio.audioBase64 &&
            ultimoAudio.id !== ultimoAudioPopupRef.current
          ) {
            ultimoAudioPopupRef.current =
              ultimoAudio.id;

            setAudioPopupRecebido(
              ultimoAudio.audioBase64
            );

            setPopupAudioRecebidoAberto(true);
          }
        }
      );

    return () => {
      pararDeOuvir();
    };

  }, [unidadeId, criadoEmChamada]);
  useEffect(() => {
    if (!unidadeId) {
      setLiveConviteVisitante(null);
      return;
    }

    const chamadaRef =
      ref(
        db,
        `unidades-v2/${unidadeId}/chamada`
      );

    let pararSessao:
      | (() => void)
      | null = null;

    let caminhoAtual =
      "";

    const pararChamada =
      onValue(
        chamadaRef,
        (snapshot) => {
          const chamada =
            snapshot.val();

          const criadoEm =
            String(
              chamada?.criadoEm || ""
            );

          if (
            chamada?.status !== "Em atendimento" ||
            !criadoEm
          ) {
            setLiveConviteVisitante(null);

            if (pararSessao) {
              pararSessao();
              pararSessao = null;
            }

            caminhoAtual = "";
            return;
          }

          const criadoMs =
            Date.parse(criadoEm);

          if (!Number.isFinite(criadoMs)) {
            return;
          }

          const caminho =
            `qrcall-live/${unidadeId}/${String(criadoMs)}`;

          if (caminho === caminhoAtual) {
            return;
          }

          if (pararSessao) {
            pararSessao();
          }

          caminhoAtual =
            caminho;

          pararSessao =
            onValue(
              ref(
                db,
                caminho
              ),
              (sessaoSnapshot) => {
                const sessao =
                  sessaoSnapshot.val();

                if (
                  sessao &&
                  String(
                    sessao.criadoEm || ""
                  ) === criadoEm &&
                  sessao.iniciadaPor ===
                    "visitante" &&
                  (
                    sessao.tipo === "audio" ||
                    sessao.tipo === "video"
                  ) &&
                  sessao.estado ===
                    "solicitando"
                ) {
                  setLiveConviteVisitante({
                    unidadeId,
                    criadoEm,
                    tipo:
                      sessao.tipo === "video"
                        ? "video"
                        : "audio",
                  });
                } else {
                  setLiveConviteVisitante(
                    null
                  );
                }
              }
            );
        }
      );

    return () => {
      pararChamada();

      if (pararSessao) {
        pararSessao();
      }
    };
  }, [unidadeId]);

  // QRCALL_A8_1_TIPO_ANTES_PAINEL
  //
  // Antes de liberar o painel comum, verifica se
  // esta mesma chamada possui solicitacao Live.
  async function resolverLiveAntesDoPainel(
    criadoEmLive: string
  ) {
    const criadoMs =
      Date.parse(criadoEmLive);

    if (!Number.isFinite(criadoMs)) {
      return;
    }

    const liveRef =
      ref(
        db,
        `qrcall-live/${unidadeId}/${String(criadoMs)}`
      );

    // Normalmente a sessao ja existe antes do aceite.
    // Esta pequena janela cobre somente a corrida
    // entre o push e a criacao do convite Live.
    for (
      let tentativa = 0;
      tentativa < 12;
      tentativa++
    ) {
      try {
        const snapshot =
          await get(liveRef);

        if (snapshot.exists()) {
          const sessao =
            snapshot.val() || {};

          const mesmaChamada =
            String(
              sessao.criadoEm || ""
            ) === criadoEmLive;

          const origemVisitante =
            sessao.iniciadaPor === "visitante";

          const tipoValido =
            sessao.tipo === "audio" ||
            sessao.tipo === "video";

          const estadoValido =
            sessao.estado === "solicitando" ||
            sessao.estado === "aceita";

          if (
            mesmaChamada &&
            origemVisitante &&
            tipoValido &&
            estadoValido
          ) {
            setLiveConviteVisitante({
              unidadeId,
              criadoEm: criadoEmLive,
              tipo:
                sessao.tipo === "video"
                  ? "video"
                  : "audio",
            });

            return;
          }
        }
      } catch (erro) {
        console.warn(
          "QRCALL_A8_1_RESOLVER_LIVE:",
          erro
        );
      }

      await new Promise<void>(
        (resolver) => {
          window.setTimeout(
            resolver,
            100
          );
        }
      );
    }
  }
  async function responderLigacaoVisitante(
    aceitar: boolean
  ) {
    const convite =
      liveConviteVisitante;

    if (!convite) {
      return;
    }

    try {
      const criadoMs =
        Date.parse(
          convite.criadoEm
        );

      if (!Number.isFinite(criadoMs)) {
        throw new Error(
          "Identidade Live invalida."
        );
      }

      await update(
        ref(
          db,
          `qrcall-live/${convite.unidadeId}/${String(criadoMs)}`
        ),
        {
          estado:
            aceitar
              ? "aceita"
              : "recusada",

          atualizadaEmMs:
            Date.now(),

          respondidaPor:
            "morador",
        }
      );

      // QRCALL_AUDIO_REAL_MORADOR_APOS_ACEITE
      // Somente o aceite positivo inicia o audio real.
      if (aceitar) {
        if (convite.tipo === "video") {
          setLiveVideoEmCurso(true);
        }

        await iniciarLiveMorador(
          convite.criadoEm,
          convite.tipo
        );
      }

      setLiveConviteVisitante(null);

      // Microfone/WebRTC ainda NAO inicia aqui.
    } catch (erro) {
      console.error(
        "QRCALL_AUDIO_RESPOSTA_MORADOR:",
        erro
      );

      alert(
        "Nao foi possivel responder a solicitacao de audio."
      );
    }
  }
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
        "Unidade n\u00e3o identificada."
      );

      setIniciando(false);
      return;
    }

    if (
      !criadoEmChamada ||
      !responsavelUidChamada
    ) {
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
                  criadoEmEsperado:
                    criadoEmChamada,
                  responsavelUidEsperado:
                    responsavelUidChamada,
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
            "N\u00e3o foi poss\u00edvel iniciar o atendimento."
          );
        }

        const atendidoEmConfirmado =
          String(dados?.atendidoEm || "");

        if (atendidoEmConfirmado) {
          setTimeout(() => {
            void fetch("/api/qrcall/timeout-atendimento", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                unidadeId,
                atendidoEmEsperado: atendidoEmConfirmado,
              }),
            });
          }, 2 * 60 * 1000);
        }

        /*
         * Remove ?iniciar=1 depois da confirma\u00e7\u00e3o.
         * Assim refresh n\u00e3o tenta atender novamente.
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

        // QRCALL_A9_13_VIDEO_DIRETO_LIVE
        // O balao nativo ja foi o aceite definitivo.
        // No video vindo do balao, nao montar outro convite.
        if (entradaVideoNativa) {
          setLiveVideoEmCurso(true);
          setLiveConviteVisitante(null);

          // QRCALL_A9_13_1_CHAVE_LIVE_MS
          // Firebase RTDB nao aceita "." na chave.
          // Mantem o mesmo padrao ja usado pelo fluxo Live existente.
          const criadoMs =
            Date.parse(
              criadoEmChamada
            );

          if (!Number.isFinite(criadoMs)) {
            throw new Error(
              "Identidade Live invalida."
            );
          }

          const sessaoVideoRef =
            ref(
              db,
              `qrcall-live/${unidadeId}/${String(criadoMs)}`
            );

          await update(
            sessaoVideoRef,
            {
              estado: "aceita",
              atualizadaEmMs: Date.now(),
              respondidaPor: "morador",
            }
          );

          await iniciarLiveMorador(
            criadoEmChamada,
            "video"
          );

          setIniciando(false);
          return;
        }

        // QRCALL_AUDIO_DIRETO_V2_LIVE
        // O balao nativo ja foi o aceite definitivo.
        // Nao monta segundo convite/popup Web.
        if (entradaAudioNativa) {
          setLiveConviteVisitante(null);

          const criadoMsAudio =
            Date.parse(
              criadoEmChamada
            );

          if (!Number.isFinite(criadoMsAudio)) {
            throw new Error(
              "Identidade Live invalida."
            );
          }

          const sessaoAudioRef =
            ref(
              db,
              `qrcall-live/${unidadeId}/${String(criadoMsAudio)}`
            );

          await update(
            sessaoAudioRef,
            {
              estado: "aceita",
              atualizadaEmMs: Date.now(),
              respondidaPor: "morador",
            }
          );

          await iniciarLiveMorador(
            criadoEmChamada,
            "audio"
          );

          setIniciando(false);
          return;
        }

        // Demais fluxos continuam exatamente como estavam.
        await resolverLiveAntesDoPainel(
          criadoEmChamada
        );

        // QRCALL_A9_7H_VIDEO_DIRETO_ANTES_PAINEL
        //
        // O usuario ja apertou ATENDER VIDEOCHAMADA
        // no balao nativo. Antes de liberar qualquer
        // interface Web, confirmamos se existe uma sessao
        // de VIDEO correspondente a esta chamada.
        //
        // Audio e chamadas comuns nao entram neste bloco.
        const criadoMsVideoNativo =
          Date.parse(criadoEmChamada);

        if (
          Number.isFinite(criadoMsVideoNativo)
        ) {
          const sessaoVideoRef =
            ref(
              db,
              `qrcall-live/${unidadeId}/${String(
                criadoMsVideoNativo
              )}`
            );

          const snapshotVideo =
            await get(sessaoVideoRef);

          const sessaoVideo =
            snapshotVideo.exists()
              ? snapshotVideo.val() || {}
              : null;

          const videoVisitanteCorreto =
            !!sessaoVideo &&
            String(
              sessaoVideo.criadoEm || ""
            ) === criadoEmChamada &&
            sessaoVideo.iniciadaPor ===
              "visitante" &&
            sessaoVideo.tipo === "video" &&
            (
              sessaoVideo.estado ===
                "solicitando" ||
              sessaoVideo.estado ===
                "aceita"
            );

          if (videoVisitanteCorreto) {
            //
            // Bloqueia imediatamente qualquer painel Web.
            //
            setLiveVideoEmCurso(true);

            //
            // O balao nativo ja foi o aceite definitivo.
            //
            await update(
              sessaoVideoRef,
              {
                estado: "aceita",
                atualizadaEmMs:
                  Date.now(),
                respondidaPor:
                  "morador",
              }
            );

            //
            // Evita qualquer segundo convite Web.
            //
            setLiveConviteVisitante(null);

            //
            // Inicia a Live validada existente.
            //
            await iniciarLiveMorador(
              criadoEmChamada,
              "video"
            );
          }
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
    criadoEmChamada,
    responsavelUidChamada,
  ]);

  if (iniciando) {
    // QRCALL_A9_10_ENTRADA_VIDEO_NATIVA
    //
    // VIDEO vindo do balao nativo fica reservado para a Live.
    // Nao monta painel de mensagens.
    // Nao monta segundo convite de video.
    if (entradaVideoNativa) {
      return (
        <main
          id="qrcall-video-base-inerte"
          className="min-h-screen bg-black"
        />
      );
    }

    // Fluxos nao-video permanecem exatamente como estavam.
    return (
      <main
        id="qrcall-atendimento-pronto"
        className="min-h-screen bg-[#020617]"
      />
    );
  }
  if (erroInicio) {
    return (
      <main
        id={
          audioVisitanteRecebido
            ? "qrcall-atendimento-pronto"
            : undefined
        }
        className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6"
      >
        <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 text-center">
          <p className="text-red-400 text-xl font-black">
            N&atilde;o foi poss&iacute;vel atender
          </p>

          <p className="text-slate-300 mt-4">
            {erroInicio}
          </p>
        </div>
      </main>
    );
  }
// QRCALL_VIDEO_TIPO_SEM_NARROWING_V7
  const tipoLiveVisual =
    String(
      liveConviteVisitante?.tipo || ""
    );

  // Video solicitado:
  // nao renderiza painel de mensagens por baixo.
  if (tipoLiveVisual === "video") {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-4">
        <section className="w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl text-center">

          <div className="text-5xl mb-4">
            &#127909;
          </div>

          <h1 className="text-2xl font-black">
            LIGACAO DE VIDEO
          </h1>

          <p className="mt-3 text-slate-300">
            O visitante deseja conversar com voce por video.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Voce vera o visitante.
            Sua camera permanecera desligada.
          </p>

          <div className="mt-6 space-y-3">

            <button
              type="button"
              onClick={() => {
                void responderLigacaoVisitante(true);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-4 rounded-2xl"
            >
              ACEITAR LIGACAO
            </button>

            <button
              type="button"
              onClick={() => {
                void responderLigacaoVisitante(false);
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg py-4 rounded-2xl"
            >
              CONTINUAR SEM LIGACAO
            </button>

          </div>
        </section>
      </main>
    );
  }

  // Video ja aceito:
  // painel Web totalmente desmontado/inativo.
  // QRCALL_FINALIZAR_BASE_INERTE_V4_20260914
  if (liveVideoEmCurso || finalizandoAtendimento) {
    return (
      <main
        id="qrcall-video-base-inerte"
        className="min-h-screen bg-black"
      />
    );
  }
  return (
    <main
      id="qrcall-atendimento-pronto"
      className="min-h-screen bg-[#020617] text-white px-4 py-6"
    >
      {/* QRCALL_AUDIO_CONVITE_MORADOR */}
      {liveConviteVisitante && (
        <div className="fixed inset-0 z-[1500] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl text-center">

            <div className="text-5xl mb-4">
              &#128222;
            </div>

            <h2 className="text-2xl font-black text-white">
              {liveConviteVisitante.tipo === "video"
                ? "LIGA\u00c7\u00c3O DE V\u00cdDEO"
                : "LIGA\u00c7\u00c3O DE \u00c1UDIO"}
            </h2>

            <p className="mt-3 text-slate-300">
              {liveConviteVisitante.tipo === "video"
                ? "O visitante deseja conversar com voc\u00ea por v\u00eddeo."
                : "O visitante deseja conversar com voc\u00ea por \u00e1udio."}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {liveConviteVisitante.tipo === "video"
                ? "Voce recebera a camera do visitante somente depois da sua confirmacao. Sua camera nao sera aberta."
                : "O microfone ainda nao sera aberto antes da sua confirmacao."}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  void responderLigacaoVisitante(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-3 rounded-2xl"
              >
                ACEITAR LIGACAO
              </button>

              <button
                type="button"
                onClick={() => {
                  void responderLigacaoVisitante(false);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg py-3 rounded-2xl"
              >
                CONTINUAR SEM LIGACAO
              </button>
            </div>

          </div>
        </div>
      )}
      <audio
        ref={liveAudioRemotoRef}
        autoPlay
        playsInline
        className="hidden"
      />
      {popupAudioRecebidoAberto && audioPopupRecebido && (
        <div className="fixed inset-0 z-[1300] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-blue-500 rounded-3xl p-5 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-3">
                &#127911;
              </div>

              <h2 className="text-2xl font-black text-blue-300">
                &Aacute;udio do visitante
              </h2>

              <p className="text-slate-400 mt-2">
                Voc&ecirc; recebeu uma nova mensagem de &aacute;udio.
              </p>
            </div>

            <audio
              id="audio-popup-visitante"
              controls
              className="w-full mt-5"
              src={audioPopupRecebido}
            />

            <button
              type="button"
              onClick={() => {
                const player =
                  document.getElementById(
                    "audio-popup-visitante"
                  ) as HTMLAudioElement | null;

                if (player) {
                  void player.play();
                }
              }}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-black py-4 rounded-2xl"
            >
              &#9654;&#65039; OUVIR &Aacute;UDIO
            </button>

            <button
              type="button"
              onClick={() => {
                setPopupAudioRecebidoAberto(false);
                setAudioPopupRecebido("");
              }}
              className="w-full mt-5 bg-green-600 hover:bg-green-500 text-white text-lg font-black py-4 rounded-2xl"
            >
              ENTENDI
            </button>
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
                &times;
              </button>
            )}

            <div className="text-center mb-5">
              <div className="text-5xl mb-3">
                {gravandoAudio ? "\u{1F399}\uFE0F" : "\u{1F3A7}"}
              </div>

              <h2 className="text-2xl font-black">
                {gravandoAudio
                  ? "GRAVANDO \u00c1UDIO"
                  : "\u00c1UDIO GRAVADO"}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {gravandoAudio
                  ? "Fale normalmente e toque em parar quando terminar."
                  : audioBlob
                  ? "Confira o \u00e1udio antes de enviar ao visitante."
                  : avisoAudio || "Preparando microfone..."}
              </p>
            </div>

            {gravandoAudio && (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 text-center">
                  <p className="text-red-400 font-black animate-pulse">
                    GRAVA&Ccedil;&Atilde;O EM ANDAMENTO
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
                  &#9209;&#65039; PARAR GRAVA&Ccedil;&Atilde;O
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
                      setAvisoAudio("Enviando \u00e1udio...");

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
                                  "N\u00e3o foi poss\u00edvel converter o \u00e1udio."
                                )
                              );
                            };

                            reader.onerror = () => {
                              reject(
                                new Error(
                                  "Erro ao ler o \u00e1udio gravado."
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
                          "N\u00e3o foi poss\u00edvel enviar o \u00e1udio."
                        );
                      }

                      setAudioBlob(null);
                      setPopupAudioAberto(false);
                      setAvisoAudio("\u00c1udio enviado");

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
                          : "Erro ao enviar \u00e1udio."
                      );

                    } finally {
                      setEnviandoAudio(false);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xl font-black py-4 rounded-2xl"
                >
                  {enviandoAudio
                    ? "Enviando..."
                    : "\u{1F4E4} ENVIAR \u00c1UDIO"}
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
                    &#128260; GRAVAR NOVAMENTE
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
                  ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â TENTAR NOVAMENTE
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
                &#127968; {localNome}
              </h1>

              <p className="text-slate-400 text-lg mt-1">
                {unidade?.nome || unidadeId}
              </p>
            </div>

            <div className="border border-green-500/50 rounded-2xl px-4 py-3 text-green-400 font-black">
              Dispon&iacute;vel
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              type="button"
              className="bg-slate-800 border border-slate-600 rounded-2xl py-4 font-black text-slate-300"
            >
              C&acirc;mera
            </button>

            <button
              type="button"
              className="bg-slate-800 border border-slate-600 rounded-2xl py-4 font-black text-slate-300"
            >
              Abrir port&atilde;o
            </button>
          </div>

          <div className="mt-8 bg-slate-800 border border-green-500/20 rounded-3xl p-5">
            <h2 className="text-green-400 text-2xl font-black">
              Entrega de comida
            </h2>

            {respostasRapidasAbertas ? (
              <div className="mt-5 bg-[#111827] border border-slate-700 rounded-3xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-blue-300 text-xl font-black">
                    Respostas r&aacute;pidas
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
                            "N\u00e3o foi poss\u00edvel enviar a resposta."
                          );
                        }

                        setAvisoResposta(
                          "Resposta enviada"
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
                RESPOSTAS R&Aacute;PIDAS
              </button>
            )}

            {audioVisitanteRecebido && (
              <div className="mt-5 bg-slate-900 border border-blue-500/40 rounded-2xl p-4">
                <p className="text-blue-300 font-black mb-3">
                  &Aacute;udio do visitante
                </p>

                <audio
                  controls
                  className="w-full"
                  src={audioVisitanteRecebido}
                />
              </div>
            )}
            {/* QRCALL_LIGACAO_ACESSOS */}
            <div className="mt-5">
              <div className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">
                Falar com o visitante
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!criadoEmChamada}
                  onClick={() => {
                    if (!criadoEmChamada) return;

                    router.push(
                      `/atendimento-chamada/${encodeURIComponent(
                        unidadeId
                      )}/ligacao?tipo=audio&criadoEm=${encodeURIComponent(
                        criadoEmChamada
                      )}`
                    );
                  }}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 px-3 font-black text-sm"
                >
                  LIGA&Ccedil;&Atilde;O DE &Aacute;UDIO
                </button>

                <button
                  type="button"
                  disabled={!criadoEmChamada}
                  onClick={() => {
                    if (!criadoEmChamada) return;

                    router.push(
                      `/atendimento-chamada/${encodeURIComponent(
                        unidadeId
                      )}/ligacao?tipo=video&criadoEm=${encodeURIComponent(
                        criadoEmChamada
                      )}`
                    );
                  }}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 px-3 font-black text-sm"
                >
                  LIGA&Ccedil;&Atilde;O DE V&Iacute;DEO
                </button>
              </div>
            </div>


            <button
              type="button"
              onClick={() => {
                setPopupAudioAberto(true);
                void iniciarGravacaoAudio();
              }}
              className="w-full mt-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl py-3 text-lg font-black"
            >
              GRAVAR &Aacute;UDIO
            </button>
            <button
              type="button"
              onClick={() => {
                void finalizarAtendimentoAtual();
              }}
className="w-full mt-5 bg-red-600 hover:bg-red-500 rounded-2xl py-4 text-xl font-black"
            >
              FINALIZAR ATENDIMENTO
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
