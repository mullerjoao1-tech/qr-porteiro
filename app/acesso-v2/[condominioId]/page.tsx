"use client";

import {
  iniciarEscalonamento,
} from "@/app/services/chamadas/MotorEscalonamento";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, update, remove, set, get, onDisconnect, runTransaction } from "firebase/database";
import { db } from "../../services/firebase";
import { QrCallLiveController } from "@/app/services/qrcall-live/QrCallLiveController";
import { QrCallVideoPreviewVisitante } from "@/app/services/qrcall-live/QrCallVideoPreview";

type MensagemConversa = {
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
  visualizadoPeloMorador?: boolean;
  visualizadoPeloMoradorEm?: number;
  audioOuvidoPeloMorador?: boolean;
  audioOuvidoPeloMoradorEm?: number;
};

type MensagemConversaComId = MensagemConversa & {
  id: string;
};

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  estruturaPaiId?: string;
  estruturaPaiNome?: string;
  condominioId?: string;
  localId?: string;
  localNome?: string;
  localSlug?: string;
  tipoLocal?: string;
  chamada?: {
    nome?: string;
    motivo?: string;
    status?: string;
    criadoEm?: string;
    mensagemRapida?: string;
    respostaRapida?: string;
    resposta?: string;
    mensagemMorador?: string;
    mensagemResponsavel?: string;
    enviadoEm?: number;
    ultimaAtividade?: number;
    audioBase64?: string;
    mensagens?: Record<string, MensagemConversa>;
  };
};

type LocalCadastro = {
  id: string;
  nome: string;
  slug?: string;
  tipo?: string;
  tipoLocal?: string;
  segmento?: string;
  status?: string;
  configuracao?: {
    modoAtendimento?: string;
    [chave: string]: unknown;
  };
};

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let qrcallLiveVisitanteIniciando = false;

// QRCALL_LIVE_LOCK_INICIO_VISITANTE_20260910
// Impede entradas concorrentes antes do controller existir.
export default function AcessoV2Condominio() {
  console.log("VERSAO BUILD 05/08/2026 18:45");
  const params = useParams();
  const condominioId = String(params.condominioId || "condominio-teste");

  // QRCALL_A8_1_PERSISTENCIA
  const chaveChamadaVisitante =
    `qrcall-visitante-ativo:${condominioId}`;

  const [localCadastro, setLocalCadastro] = useState<LocalCadastro | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const tipoLocalNormalizado = (
    localCadastro?.tipo ||
    localCadastro?.tipoLocal ||
    localCadastro?.segmento ||
    ""
  )
    .trim()
    .toLowerCase();

  const localEhResidencia =
    tipoLocalNormalizado === "residencia" ||
    tipoLocalNormalizado === "residência" ||
    localCadastro?.configuracao?.modoAtendimento === "residencia";

  const [busca, setBusca] = useState("");
  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(null);
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [outroMotivo, setOutroMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [chamadaEmAtendimento, setChamadaEmAtendimento] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const [popupTexto, setPopupTexto] = useState("");
  const [popupAudioBase64, setPopupAudioBase64] = useState("");
  const [popupTipo, setPopupTipo] = useState<"mensagem" | "audio" | "encerrado">("mensagem");
  const [popupAudioFoiOuvido, setPopupAudioFoiOuvido] = useState(false);
  const [popupAudioVisitanteAberto, setPopupAudioVisitanteAberto] = useState(false);
  const [mensagensConversa, setMensagensConversa] = useState<MensagemConversaComId[]>([]);

  const chamadaAtivaRef = useRef(false);
  const chamadaFoiEnviadaRef = useRef(false);
  const ultimoPopupRef = useRef("");
function salvarIdentidadeChamada(
    unidadeIdAtiva: string,
    criadoEmAtivo: string
  ) {
    if (
      typeof window === "undefined" ||
      !unidadeIdAtiva ||
      !criadoEmAtivo
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        chaveChamadaVisitante,
        JSON.stringify({
          unidadeId: unidadeIdAtiva,
          criadoEm: criadoEmAtivo,
          condominioId,
        })
      );
    } catch (erro) {
      console.warn(
        "QRCALL_A8_1_SALVAR:",
        erro
      );
    }
  }

  function lerIdentidadeChamada():
    | {
        unidadeId: string;
        criadoEm: string;
      }
    | null {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    try {
      const bruto =
        window.localStorage.getItem(
          chaveChamadaVisitante
        );

      if (!bruto) {
        return null;
      }

      const dados =
        JSON.parse(bruto);

      const unidadeIdAtiva =
        String(
          dados?.unidadeId || ""
        );

      const criadoEmAtivo =
        String(
          dados?.criadoEm || ""
        );

      if (
        !unidadeIdAtiva ||
        !criadoEmAtivo ||
        String(
          dados?.condominioId || ""
        ) !== condominioId
      ) {
        return null;
      }

      return {
        unidadeId: unidadeIdAtiva,
        criadoEm: criadoEmAtivo,
      };
    } catch {
      return null;
    }
  }

  function limparIdentidadeChamada() {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      window.localStorage.removeItem(
        chaveChamadaVisitante
      );
    } catch {
      // best-effort
    }
  }
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // QRCALL_A8_3B_PRESENCA
  //
  // A presenca usa caminho EXCLUSIVO da chamada:
  //
  // qrcall-presenca/{unidadeId}/{sessaoId}
  //
  // Nunca usamos onDisconnect para apagar diretamente
  // unidades-v2/{unidadeId}/chamada.
  //
  // Assim uma desconexao antiga jamais consegue apagar
  // uma chamada nova da mesma unidade.
  const presencaOnDisconnectRef =
    useRef<ReturnType<typeof onDisconnect> | null>(
      null
    );

  const presencaFirebaseRef =
    useRef<ReturnType<typeof ref> | null>(
      null
    );

  async function encerrarPresencaVisitante(
    removerAgora = true
  ) {
    const operacao =
      presencaOnDisconnectRef.current;

    const referencia =
      presencaFirebaseRef.current;

    presencaOnDisconnectRef.current =
      null;

    presencaFirebaseRef.current =
      null;

    if (operacao) {
      try {
        await operacao.cancel();
      } catch {
        // best-effort
      }
    }

    if (
      removerAgora &&
      referencia
    ) {
      try {
        await remove(
          referencia
        );
      } catch {
        // best-effort
      }
    }
  }

  async function registrarPresencaVisitante(
    unidadeIdAtiva: string,
    criadoEmAtivo: string
  ) {
    const criadoMs =
      Date.parse(
        criadoEmAtivo
      );

    if (
      !unidadeIdAtiva ||
      !Number.isFinite(criadoMs)
    ) {
      throw new Error(
        "Identidade invalida para presenca do visitante."
      );
    }

    await encerrarPresencaVisitante(
      true
    );

    const referencia =
      ref(
        db,
        `qrcall-presenca/${unidadeIdAtiva}/${String(criadoMs)}`
      );

    /*
     * Primeiro criamos a presenca.
     * So depois a chamada sera gravada.
     */
    await set(
      referencia,
      {
        unidadeId:
          unidadeIdAtiva,

        criadoEm:
          criadoEmAtivo,

        sessaoId:
          String(criadoMs),

        ativo:
          true,

        atualizadoEm:
          Date.now(),
      }
    );

    /*
     * O Firebase registra no SERVIDOR a remocao
     * desta presenca quando a conexao desaparecer.
     *
     * Ela e exclusiva desta sessao.
     */
    const operacao =
      onDisconnect(
        referencia
      );

    await operacao.remove();

    presencaFirebaseRef.current =
      referencia;

    presencaOnDisconnectRef.current =
      operacao;

    console.log(
      "QRCALL_A8_3B_PRESENCA_REGISTRADA",
      unidadeIdAtiva,
      criadoEmAtivo
    );
  }


  // QRCALL_A8_3C_TRANSACAO_ORFA
  //
  // Regra:
  //
  // chamada ativa + presenca daquela identidade ausente
  // = visitante abandonou.
  //
  // A exclusao ocorre diretamente por transacao Firebase,
  // mas SOMENTE se unidadeId + criadoEm ainda corresponderem
  // a chamada que estamos verificando.
  useEffect(() => {
    if (
      carregando ||
      unidades.length === 0
    ) {
      return;
    }

    let cancelado =
      false;

    async function limparChamadasOrfas() {
      for (
        const unidade of unidades
      ) {
        if (cancelado) {
          return;
        }

        const chamada =
          unidade.chamada;

        if (!chamada) {
          continue;
        }

        const status =
          String(
            chamada.status || ""
          );

        const criadoEm =
          String(
            chamada.criadoEm || ""
          );

        const terminal =
          !status ||
          status === "Encerrado" ||
          status === "Finalizado" ||
          status === "Cancelado pelo visitante" ||
          status === "Cancelada pelo visitante" ||
          status === "Atendimento encerrado";

        if (
          terminal ||
          !criadoEm
        ) {
          continue;
        }

        const criadoMs =
          Date.parse(
            criadoEm
          );

        if (
          !Number.isFinite(
            criadoMs
          )
        ) {
          continue;
        }

        const referenciaPresenca =
          ref(
            db,
            `qrcall-presenca/${unidade.id}/${String(criadoMs)}`
          );

        try {
          const snapshotPresenca =
            await get(
              referenciaPresenca
            );

          if (
            cancelado ||
            snapshotPresenca.exists()
          ) {
            continue;
          }

          console.log(
            "QRCALL_A8_3C_ORFA_DETECTADA",
            unidade.id,
            criadoEm
          );

          const referenciaChamada =
            ref(
              db,
              `unidades-v2/${unidade.id}/chamada`
            );

          /*
           * PROTECAO DE IDENTIDADE.
           *
           * Se outra chamada ocupou este mesmo caminho
           * depois, a transacao retorna o valor intacto.
           */
          const resultado =
            await runTransaction(
              referenciaChamada,
              (atual) => {
                if (!atual) {
                  return atual;
                }

                const criadoAtual =
                  String(
                    atual.criadoEm || ""
                  );

                if (
                  criadoAtual !==
                  criadoEm
                ) {
                  return atual;
                }

                /*
                 * null numa transaction Firebase
                 * remove este no.
                 */
                return null;
              },
              {
                applyLocally:
                  false,
              }
            );

          if (cancelado) {
            return;
          }

          /*
           * Se a transacao removeu a chamada,
           * limpamos somente os dados Live da MESMA
           * identidade.
           */
          if (
            resultado.committed &&
            !resultado.snapshot.exists()
          ) {
            try {
              await remove(
                ref(
                  db,
                  `qrcall-live/${unidade.id}/${String(criadoMs)}`
                )
              );
            } catch (erroLive) {
              console.warn(
                "QRCALL_A8_3C_LIVE:",
                erroLive
              );
            }

            try {
              await remove(
                referenciaPresenca
              );
            } catch {
              // ja pode estar ausente
            }

            const persistida =
              lerIdentidadeChamada();

            if (
              persistida?.unidadeId ===
                unidade.id &&
              persistida?.criadoEm ===
                criadoEm
            ) {
              limparIdentidadeChamada();
            }

            console.log(
              "QRCALL_A8_3C_ORFA_REMOVIDA",
              unidade.id,
              criadoEm
            );
          }
        } catch (erro) {
          console.warn(
            "QRCALL_A8_3C_ERRO:",
            erro
          );
        }
      }
    }

    void limparChamadasOrfas();

    return () => {
      cancelado =
        true;
    };
  }, [
    carregando,
    unidades,
  ]);
  // QRCALL_LIVE_CONVITE_VISITANTE
  const [liveConvite, setLiveConvite] =
    useState<{
      unidadeId: string;
      criadoEm: string;
      tipo: "audio" | "video";
    } | null>(null);
  // QrCall Live - independente do audio gravado.
  const liveControllerRef =
    useRef<QrCallLiveController | null>(null);

  // QRCALL_A9_1_VIDEO_PREVIEW_REF
  const videoPreviewVisitanteRef =
    useRef<QrCallVideoPreviewVisitante | null>(
      null
    );
  const liveAudioRemotoRef =
    useRef<HTMLAudioElement | null>(null);

  const [liveEstado, setLiveEstado] =
    useState("");

  const [liveErro, setLiveErro] =
    useState("");

  async function iniciarLiveVisitante(
    unidadeIdLive: string,
    criadoEmLive: string,
    tipoLive: "audio" | "video" = "audio"
  ) {
    if (
      liveControllerRef.current ||
      qrcallLiveVisitanteIniciando
    ) {
      return;
    }

    // A trava precisa acontecer ANTES do primeiro await.
    qrcallLiveVisitanteIniciando = true;

    window.setTimeout(() => {
      if (!liveControllerRef.current) {
        qrcallLiveVisitanteIniciando = false;
      }
    }, 10000);

    setLiveErro("");
    setLiveEstado("preparando");

    // QRCALL_DIAGNOSTICO_WEB_VISITANTE
    // QRCALL_TIMELINE_WEBRTC_VISITANTE_V2
    const timelineLiveInicioMs = Date.now();
    const diagnosticoLiveRef = ref(
      db,
      `qrcall-live/${unidadeIdLive}/${String(
        Date.parse(criadoEmLive)
      )}/diagnosticoVisitante`
    );

    const registrarDiagnosticoVisitante = async (
      dados: Record<string, unknown>
    ) => {
      try {
        await update(
          diagnosticoLiveRef,
          {
            ...dados,
            atualizadoEmMs: Date.now(),
          }
        );
      } catch (erroDiagnostico) {
        console.error(
          "QRCALL_DIAGNOSTICO_WEB_VISITANTE:",
          erroDiagnostico
        );
      }
    };

    await registrarDiagnosticoVisitante({
      etapa: "iniciarLiveVisitante",
      secureContext:
        typeof window !== "undefined"
          ? window.isSecureContext
          : false,
      possuiMediaDevices:
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices,
      possuiGetUserMedia:
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    });

    const controller =
      new QrCallLiveController({
        db,
        unidadeId: unidadeIdLive,
        criadoEm: criadoEmLive,
        lado: "visitante",
        // QRCALL_VIDEO_VISITANTE_REAL_20260910
        tipo: tipoLive,

        onEstado: (estado) => {
          setLiveEstado(estado);

          // QRCALL_DIAGNOSTICO_ESTADO_VISITANTE
          void registrarDiagnosticoVisitante({
            etapa: "estado_controller",
            estadoController: estado,
            [`timelineEstado_${estado}Ms`]: Date.now(),
          });
        },

        onRemoteStream: (stream) => {
          void registrarDiagnosticoVisitante({
            timelineRemoteStreamMs: Date.now(),
          });
          const player =
            liveAudioRemotoRef.current;

          if (!player) return;

          player.srcObject = stream;

          void player.play().catch(() => {
            // Pode exigir interacao do usuario.
          });
        },

        onErro: (erro) => {
          console.error(
            "QRCALL_LIVE_VISITANTE:",
            erro
          );

          void registrarDiagnosticoVisitante({
            etapa: "erro_interno_controller",
            erroNome: erro.name,
            erroMensagem: erro.message,
          });

          setLiveErro(erro.message);
        },
      });

    liveControllerRef.current =
      controller;

    // O controller agora existe e passa a ser a trava principal.
    qrcallLiveVisitanteIniciando = false;

    try {
      await registrarDiagnosticoVisitante({
        etapa: "antes_controller",
      timelineInicioMs: timelineLiveInicioMs,
      timelineAntesControllerMs: Date.now(),
      });

      await controller.iniciarComoVisitante();

      await registrarDiagnosticoVisitante({
        etapa: "controller_iniciado",
      });
    } catch (erro) {
      const erroFinal =
        erro instanceof Error
          ? erro
          : new Error(String(erro));

      await registrarDiagnosticoVisitante({
        etapa: "erro_controller",
        erroNome: erroFinal.name,
        erroMensagem: erroFinal.message,
      });
      try {
        await controller.encerrar();
      } catch {
        // Limpeza best-effort.
      }

      liveControllerRef.current = null;
      setLiveEstado("erro");

      setLiveErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao iniciar voz ao vivo."
      );
    }
  }

  async function encerrarLiveVisitante() {
    // QRCALL_A9_1_VIDEO_PREVIEW_ENCERRAR
    const previewAtual =
      videoPreviewVisitanteRef.current;

    videoPreviewVisitanteRef.current =
      null;

    if (previewAtual) {
      try {
        await previewAtual
          .encerrar();
      } catch {
      }
    }
    const controller =
      liveControllerRef.current;

    liveControllerRef.current = null;

    if (controller) {
      await controller.encerrar();
    }

    if (liveAudioRemotoRef.current) {
      liveAudioRemotoRef.current.srcObject =
        null;
    }

    setLiveEstado("");
  }

  useEffect(() => {
    return () => {
      // QRCALL_A9_1_VIDEO_PREVIEW_UNMOUNT
      const previewAtual =
        videoPreviewVisitanteRef.current;

      videoPreviewVisitanteRef.current =
        null;

      if (previewAtual) {
        void previewAtual
          .encerrar();
      }

      const controller =
        liveControllerRef.current;

      liveControllerRef.current = null;

      if (controller) {
        void controller.encerrar();
      }
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarLocal() {
      try {
        const referenciaDireta = ref(db, `locais-v2/${condominioId}`);
        const snapshotDireto = await get(referenciaDireta);

        if (snapshotDireto.exists()) {
          if (!cancelado) {
            setLocalCadastro({
              id: condominioId,
              ...snapshotDireto.val(),
            });
          }
          return;
        }

        const snapshotLocais = await get(ref(db, "locais-v2"));

        if (!snapshotLocais.exists()) {
          if (!cancelado) setLocalCadastro(null);
          return;
        }

        const locais = snapshotLocais.val() as Record<string, Partial<LocalCadastro>>;
        const encontrado = Object.entries(locais).find(
          ([id, local]) =>
            id === condominioId ||
            local.slug === condominioId ||
            local.id === condominioId
        );

        if (!cancelado) {
          setLocalCadastro(
            encontrado
              ? {
                  ...encontrado[1],
                  id: encontrado[1].id || encontrado[0],
                  nome: encontrado[1].nome || "QR Acesso",
                }
              : null
          );
        }
      } catch (erro) {
        console.error("Erro ao carregar o local no Cadastro Universal:", erro);
        if (!cancelado) setLocalCadastro(null);
      }
    }

    carregarLocal();

    const referencia = ref(db, "unidades-v2");
    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidades([]);
        setCarregando(false);
        return;
      }

      const todasAsUnidades = Object.entries(dados).map(
        ([id, valor]: [string, any]) => {
          const nomeUnidade =
            typeof valor.nome === "string"
              ? valor.nome.trim()
              : "";

          const blocoPeloNome =
            nomeUnidade.match(/^(Bloco\s+\d+)/i)?.[1] || "";

          const blocoNormalizado =
            valor.bloco ||
            valor.estruturaPaiNome ||
            (valor.estruturaPaiId
              ? String(valor.estruturaPaiId)
                  .replace(/^bloco-/i, "Bloco ")
                  .replace(/-/g, " ")
              : "") ||
            blocoPeloNome;

          return {
            id,
            ...valor,
            bloco: blocoNormalizado,
          };
        }
      ) as Unidade[];

      const localIdAtual = localCadastro?.id || condominioId;

      const unidadesVinculadas = todasAsUnidades.filter(
        (unidade) =>
          unidade.localId === localIdAtual ||
          unidade.condominioId === localIdAtual ||
          unidade.localId === condominioId ||
          unidade.condominioId === condominioId
      );

      const unidadesSemVinculo = todasAsUnidades.filter(
        (unidade) => !unidade.localId && !unidade.condominioId
      );

      const lista = unidadesVinculadas.length > 0
        ? unidadesVinculadas
        : unidadesSemVinculo;

      lista.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
      );

      setUnidades(lista);
      setCarregando(false);
    });

    return () => {
      cancelado = true;
      pararDeOuvir();
    };
  }, [condominioId, localCadastro?.id]);

  useEffect(() => {
    if (
      localEhResidencia &&
      unidades.length === 1 &&
      !unidadeSelecionada
    ) {
      setUnidadeSelecionada(unidades[0]);
    }
  }, [localEhResidencia, unidadeSelecionada, unidades]);

  // QRCALL_LIVE_CONVITE_VISITANTE
  useEffect(() => {
    if (
      !unidadeSelecionada ||
      !chamadaEmAtendimento
    ) {
      setLiveConvite(null);
      return;
    }

    const referenciaChamada =
      ref(
        db,
        `unidades-v2/${unidadeSelecionada.id}/chamada`
      );

    let pararSessao:
      | (() => void)
      | null = null;

    let sessaoAtual = "";

    const pararChamada =
      onValue(
        referenciaChamada,
        (snapshot) => {
          const chamada =
            snapshot.val();

          const criadoEm =
            String(
              chamada?.criadoEm || ""
            );

          if (
            chamada?.status !==
              "Em atendimento" ||
            !criadoEm
          ) {
            setLiveConvite(null);

            if (pararSessao) {
              pararSessao();
              pararSessao = null;
              sessaoAtual = "";
            }

            return;
          }

          const criadoMs =
            Date.parse(
              criadoEm
            );

          if (
            !Number.isFinite(
              criadoMs
            )
          ) {
            return;
          }

          const caminho =
            `qrcall-live/${unidadeSelecionada.id}/${String(criadoMs)}`;

          if (
            caminho ===
            sessaoAtual
          ) {
            return;
          }

          if (pararSessao) {
            pararSessao();
          }

          sessaoAtual =
            caminho;

          pararSessao =
            onValue(
              ref(
                db,
                caminho
              ),
              (
                sessaoSnapshot
              ) => {
                const sessao =
                  sessaoSnapshot.val();

                if (
                  sessao &&
                  String(
                    sessao.criadoEm || ""
                  ) === criadoEm &&
                  sessao.iniciadaPor ===
                    "morador" &&
                  sessao.estado ===
                    "solicitando" &&
                  (
                    sessao.tipo ===
                      "audio" ||
                    sessao.tipo ===
                      "video"
                  )
                ) {
                  setLiveConvite({
                    unidadeId:
                      unidadeSelecionada.id,
                    criadoEm,
                    tipo:
                      sessao.tipo,
                  });
                } else {
                  setLiveConvite(
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
  }, [
    unidadeSelecionada,
    chamadaEmAtendimento,
  ]);
  useEffect(() => {
    if (!unidadeSelecionada) {
      setMensagensConversa([]);
      return;
    }

    const referencia = ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`);

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const chamada = snapshot.val();

      setChamadaEmAtendimento(
        chamada?.status === "Em atendimento"
      );

      if (!chamada || chamada.status === "Encerrado") {
        // QRCALL_A8_3B_LIMPAR_PRESENCA_FINAL
        void encerrarPresencaVisitante(
          true
        );

        // QRCALL_A8_1_LIMPAR_FINALIZADA
        limparIdentidadeChamada();
        void encerrarLiveVisitante();
        setMensagensConversa([]);

        if (chamadaAtivaRef.current && chamadaFoiEnviadaRef.current) {
          setPopupTipo("encerrado");
          setPopupAudioBase64("");
          setPopupAudioFoiOuvido(false);

          const mensagemEncerramento =
            chamada?.motivoSemResponsavel ||
            "Atendimento encerrado pelo responsável.";

          setPopupTexto(mensagemEncerramento);

          setUnidadeSelecionada(null);
          setNome("");
          setMotivo("");
          setOutroMotivo("");
          setMensagem("");
          setAudioBlob(null);
          setGravandoAudio(false);
          setEnviandoAudio(false);
          setBusca("");
          setBlocoSelecionado("");
        }

        chamadaAtivaRef.current = false;
        chamadaFoiEnviadaRef.current = false;
        ultimoPopupRef.current = "";
        return;
      }

      if (!chamadaFoiEnviadaRef.current) return;

      chamadaAtivaRef.current = true;

      const criadoEmChamadaMs =
        chamada.criadoEm
          ? new Date(chamada.criadoEm).getTime()
          : 0;

      const todasAsMensagens: MensagemConversaComId[] = chamada.mensagens
        ? (Object.entries(chamada.mensagens) as Array<[string, MensagemConversa]>)
            .map(([id, item]) => ({ id, ...item }))
            .filter((item) => {
              const criadoEmMensagem =
                Number(item.criadoEm || item.id);

              if (!criadoEmChamadaMs) {
                return true;
              }

              return criadoEmMensagem >= criadoEmChamadaMs;
            })
            .sort(
              (mensagemA, mensagemB) =>
                Number(mensagemA.criadoEm || mensagemA.id) -
                Number(mensagemB.criadoEm || mensagemB.id)
            )
        : [];

      setMensagensConversa(todasAsMensagens);

      const mensagensMorador = todasAsMensagens.filter(
        (item) => item.autor === "morador"
      );

      const ultimaMensagemMorador =
        mensagensMorador.length > 0
          ? mensagensMorador[mensagensMorador.length - 1]
          : null;

      if (ultimaMensagemMorador) {
        const item = ultimaMensagemMorador;
        const idMensagem = `${item.id}-${item.criadoEm || ""}`;

        if (idMensagem !== ultimoPopupRef.current) {
          ultimoPopupRef.current = idMensagem;

          if (item.tipo === "audio" && item.audioBase64) {
            setPopupTipo("audio");
            setPopupTexto("Você recebeu um áudio do morador.");
            setPopupAudioBase64(item.audioBase64);
            setPopupAudioFoiOuvido(false);
            return;
          }

          if (item.tipo === "texto" && item.texto) {
            setPopupTipo("mensagem");
            setPopupAudioBase64("");
            setPopupAudioFoiOuvido(false);
            setPopupTexto(item.texto);
            return;
          }
        }
      }

      const textoResposta =
        chamada.mensagemRapida ||
        chamada.respostaRapida ||
        chamada.mensagemResponsavel ||
        chamada.resposta ||
        chamada.mensagemMorador ||
        "";

      const idMensagemAntiga = `${textoResposta}-${chamada.enviadoEm || ""}`;

      if (
        !ultimaMensagemMorador &&
        textoResposta &&
        idMensagemAntiga !== ultimoPopupRef.current &&
        textoResposta !== "ATENDIMENTO_ENCERRADO"
      ) {
        ultimoPopupRef.current = idMensagemAntiga;
        setPopupTipo("mensagem");
        setPopupAudioBase64("");
        setPopupAudioFoiOuvido(false);
        setPopupTexto(textoResposta);
      }
    });

    return () => pararDeOuvir();
  }, [unidadeSelecionada]);

  const blocos = useMemo(() => {
    const lista = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, index, array) => array.indexOf(valor) === index);

    return lista.sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true })
    );
  }, [unidades]);

  const temBlocos = blocos.length > 1 || blocos[0] !== "Único";

  const unidadesDoBloco = useMemo(() => {
    if (!temBlocos) return unidades;

    return unidades.filter(
      (unidade) => (unidade.bloco || "Único") === blocoSelecionado
    );
  }, [unidades, blocoSelecionado, temBlocos]);

  const unidadesFiltradas = useMemo(() => {
    const texto = busca.toLowerCase().trim();
    if (!texto) return unidadesDoBloco;

    return unidadesDoBloco.filter((unidade) =>
      `${unidade.nome} ${unidade.tipo || ""} ${unidade.id}`
        .toLowerCase()
        .includes(texto)
    );
  }, [busca, unidadesDoBloco]);

  const precisaNome = motivo === "Visitante";
  const precisaDescricao = motivo === "Outros";

  const chamadaVisualAtiva =
    Boolean(mensagem) || chamadaEmAtendimento;

  async function chamarUnidade(
    modalidadeRecebida: unknown = "comum"
  ) {
    // QRCALL_A9_5C_MODALIDADE_ORIGEM
    const modalidadeChamada:
      | "comum"
      | "audio"
      | "video" =
      modalidadeRecebida === "audio"
        ? "audio"
        : modalidadeRecebida === "video"
        ? "video"
        : "comum";
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade.");
      return;
    }

    if (!motivo) {
      alert("Escolha o motivo da chamada.");
      return;
    }

    if (precisaNome && !nome.trim()) {
      alert("Digite seu nome.");
      return;
    }

    if (precisaDescricao && !outroMotivo.trim()) {
      alert("Descreva o motivo.");
      return;
    }

    const motivoFinal = motivo === "Outros" ? outroMotivo.trim() : motivo;
    let nomeFinal = nome.trim();

    if (motivo === "Entrega") nomeFinal = "Entrega";
    if (motivo === "Entrega de comida") nomeFinal = "Entrega de comida";
    if (motivo === "Outros" && !nomeFinal) nomeFinal = "Outro chamado";

    const unidadeIdAtual = unidadeSelecionada.id;
    const unidadeNomeAtual = unidadeSelecionada.nome;

    try {
      setDiagnostico("");
      setMensagem("");
      setEnviando(true);
      setPopupTexto("");
      setPopupAudioBase64("");
      setPopupAudioFoiOuvido(false);
      setMensagensConversa([]);

      ultimoPopupRef.current = "";
      chamadaFoiEnviadaRef.current = true;
      chamadaAtivaRef.current = true;
      setDiagnostico("Gravando chamada...");

      const criadoEmChamada =
        new Date().toISOString();

      // QRCALL_A8_3B_PRESENCA_CHAMADA
      await registrarPresencaVisitante(
        unidadeIdAtual,
        criadoEmChamada
      );

      await update(
        ref(db, `unidades-v2/${unidadeIdAtual}/chamada`),
        {
          nome: nomeFinal,
          motivo: motivoFinal,
          status: "Aguardando atendimento",
          criadoEm: criadoEmChamada,
          notificar: true,
          condominioId,
          origem: "acesso-v2",

          modalidadeChamada,

          mensagemRapida: null,
          respostaRapida: null,
          mensagemResponsavel: null,
          resposta: null,
          mensagemMorador: null,
          enviadoEm: null,
          audioBase64: null,
          mensagens: null,
        }
      );

      // QRCALL_A8_1_SALVAR_IDENTIDADE
      salvarIdentidadeChamada(
        unidadeIdAtual,
        criadoEmChamada
      );
      const resultadoEscalonamento =
        await iniciarEscalonamento(
          unidadeIdAtual,
          `unidades-v2/${unidadeIdAtual}/chamada`
        );

      if (
        !resultadoEscalonamento.sucesso ||
        !resultadoEscalonamento.responsavel
      ) {
        await encerrarPresencaVisitante(true);

        await update(
          ref(db, `unidades-v2/${unidadeIdAtual}/chamada`),
          {
            status: "Encerrado",
            notificar: false,
            motivoSemResponsavel: "Nenhum responsavel disponivel no momento.",
            encerradoEm: Date.now(),
          }
        );

        setEnviando(false);
        setDiagnostico("Nenhum responsavel disponivel.");
        setMensagem("Nenhum responsavel esta disponivel no momento.");
        setTimeout(() => {
          limparSelecao();
        }, 3000);

        return;
      }
      // QRCALL_A9_12_PREVIEW_ANTES_PUSH
      // Para video, a camera do visitante e a offer WebRTC precisam
      // estar prontas no Firebase ANTES de o push abrir o balao nativo.
      if (modalidadeChamada === "video") {
        try {
          const previewAnterior =
            videoPreviewVisitanteRef.current;

          if (previewAnterior) {
            await previewAnterior.encerrar();
          }

          const preview =
            new QrCallVideoPreviewVisitante({
              db,
              unidadeId: unidadeIdAtual,
              criadoEm: criadoEmChamada,
            });

          videoPreviewVisitanteRef.current =
            preview;

          await preview.iniciar();

          // Neste ponto preview.iniciar() ja concluiu:
          // camera -> createOffer -> setLocalDescription ->
          // qrcall-video-preview/.../offer no Firebase.
        } catch (erroPreview) {
          videoPreviewVisitanteRef.current =
            null;

          console.warn(
            "QRCALL_A9_12_PREVIEW_ANTES_PUSH_FALHOU:",
            erroPreview
          );

          // Mantem a chamada funcional mesmo se o preview falhar.
        }
      }



      setTimeout(() => {
        void fetch("/api/qrcall/timeout-aguardando", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unidadeId: unidadeIdAtual,
            criadoEmEsperado: criadoEmChamada,
          }),
        });
      }, 3 * 60 * 1000);
      setEnviando(false);
      setDiagnostico("✅ Chamada enviada.");
      setMensagem(
        `✅ Chamada enviada para ${unidadeNomeAtual}. Aguarde o atendimento.`
      );

      fetch("/api/enviar-notificacao-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidadeId: unidadeIdAtual,
        }),
      })
        .then(async (respostaPush) => {
          const textoResposta = await respostaPush.text();
          let dadosPush: unknown = null;

          try {
            dadosPush = textoResposta ? JSON.parse(textoResposta) : null;
          } catch {
            dadosPush = textoResposta;
          }

          console.log("RESPOSTA PUSH V2:", dadosPush);

          if (!respostaPush.ok) {
            console.warn(
              "A chamada foi gravada, mas o push não foi confirmado:",
              dadosPush
            );
          }
        })
        .catch((erroPush) => {
          console.warn(
            "A chamada foi gravada, mas ocorreu falha no push:",
            erroPush
          );
        });
    } catch (erro: unknown) {
      void encerrarPresencaVisitante(
        true
      );

      console.error("Falha ao gravar a chamada:", erro);

      const detalhe =
        erro instanceof Error
          ? erro.message
          : String(erro) || "Erro desconhecido";

      setDiagnostico("AUDIO");
      setMensagem("");
      chamadaAtivaRef.current = false;
      chamadaFoiEnviadaRef.current = false;
      setEnviando(false);
    }
  }

  async function iniciarGravacao() {
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade antes de gravar.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) {
          audioChunksRef.current.push(evento.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);
        setGravandoAudio(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setAudioBlob(null);
      setGravandoAudio(true);

      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 15000);
    } catch (erro) {
      console.error("Erro ao acessar o microfone:", erro);
      alert("Não foi possível acessar o microfone.");
      setGravandoAudio(false);
    }
  }

  function pararGravacao() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      return;
    }

    setGravandoAudio(false);
  }

  async function enviarAudioVisitante() {
    if (!unidadeSelecionada || !audioBlob) {
      alert("Grave um áudio antes de enviar.");
      return;
    }

    const referenciaChamada = ref(
      db,
      `unidades-v2/${unidadeSelecionada.id}/chamada`
    );

    try {
      setEnviandoAudio(true);

      const snapshotChamada = await get(referenciaChamada);
      const chamadaAtual = snapshotChamada.val() || {};
      const statusAtual = chamadaAtual.status || "";

      const chamadaJaAtiva =
        statusAtual &&
        statusAtual !== "Encerrado" &&
        statusAtual !== "Finalizado" &&
        statusAtual !== "Cancelado pelo visitante" &&
        statusAtual !== "Cancelada pelo visitante" &&
        statusAtual !== "Atendimento encerrado";

      if (!chamadaJaAtiva) {
        if (!motivo) {
          alert("Escolha o motivo da chamada antes de enviar o áudio.");
          return;
        }

        if (precisaNome && !nome.trim()) {
          alert("Digite seu nome antes de enviar o áudio.");
          return;
        }

        if (precisaDescricao && !outroMotivo.trim()) {
          alert("Descreva o motivo antes de enviar o áudio.");
          return;
        }
      }

      const audioBase64 = await blobParaBase64(audioBlob);
      const criadoEmMensagem = Date.now();
      const idMensagem = String(criadoEmMensagem);

      if (!chamadaJaAtiva) {
        const motivoFinal = motivo === "Outros" ? outroMotivo.trim() : motivo;
        let nomeFinal = nome.trim();

        if (motivo === "Entrega") nomeFinal = "Entrega";
        if (motivo === "Entrega de comida") nomeFinal = "Entrega de comida";
        if (motivo === "Outros" && !nomeFinal) nomeFinal = "Outro chamado";

        chamadaFoiEnviadaRef.current = true;
        chamadaAtivaRef.current = true;
        ultimoPopupRef.current = "";

        const criadoEmNovaChamada =
          new Date().toISOString();

        // QRCALL_A8_3B_PRESENCA_AUDIO
        await registrarPresencaVisitante(
          unidadeSelecionada.id,
          criadoEmNovaChamada
        );

        await update(referenciaChamada, {
          nome: nomeFinal,
          motivo: motivoFinal,
          status: "Aguardando atendimento",
          criadoEm:
            criadoEmNovaChamada,
          notificar: true,
          condominioId,
          origem: "acesso-v2",
          mensagemRapida: null,
          respostaRapida: null,
          mensagemResponsavel: null,
          resposta: null,
          mensagemMorador: null,
          visualizadoPeloVisitante: false,
          audioBase64: null,
          mensagens: null,
        });

        salvarIdentidadeChamada(
          unidadeSelecionada.id,
          criadoEmNovaChamada
        );

        const resultadoEscalonamentoAudio =
          await iniciarEscalonamento(
            unidadeSelecionada.id,
            `unidades-v2/${unidadeSelecionada.id}/chamada`
          );

        if (
          !resultadoEscalonamentoAudio.sucesso ||
          !resultadoEscalonamentoAudio.responsavel
        ) {
          await encerrarPresencaVisitante(true);

          await update(
            referenciaChamada,
            {
              status: "Encerrado",
              notificar: false,
              motivoSemResponsavel: "Nenhum responsavel disponivel no momento.",
              encerradoEm: Date.now(),
            }
          );

          setEnviandoAudio(false);
          setDiagnostico("Nenhum responsavel disponivel.");
          setMensagem("Nenhum responsavel esta disponivel no momento.");
          setTimeout(() => {
            limparSelecao();
          }, 3000);

          return;
        }
      }

      await set(
        ref(
          db,
          `unidades-v2/${unidadeSelecionada.id}/chamada/mensagens/${idMensagem}`
        ),
        {
          autor: "visitante",
          tipo: "audio",
          audioBase64,
          criadoEm: criadoEmMensagem,
        }
      );

      await update(referenciaChamada, {
        audioBase64,
        ultimaAtividade: criadoEmMensagem,
        enviadoEm: criadoEmMensagem,
        ...(chamadaJaAtiva
          ? {}
          : {
              status: "Aguardando atendimento",
              notificar: true,
            }),
      });

      if (!chamadaJaAtiva) {
        try {
          const respostaPush = await fetch("/api/enviar-notificacao-v2", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              unidadeId: unidadeSelecionada.id,
            }),
          });

          const dadosPush = await respostaPush.json();
          console.log("RESPOSTA PUSH V2 - ÁUDIO:", dadosPush);
        } catch (erroPush) {
          console.error("Erro ao enviar push da chamada por áudio:", erroPush);
        }
      }

      setAudioBlob(null);
      setPopupAudioVisitanteAberto(false);
      setMensagem(
        chamadaJaAtiva
          ? "✅ Áudio enviado para o responsável."
          : `✅ Chamada com áudio enviada para ${unidadeSelecionada.nome}. Aguarde o atendimento.`
      );
    } catch (erro) {
      console.error("Erro ao enviar áudio:", erro);
      alert("Erro ao enviar áudio. Tente novamente.");
    } finally {
      setEnviandoAudio(false);
    }
  }

  // QRCALL_AUDIO_SOLICITACAO_VISITANTE
  async function solicitarLigacaoVisitante(
    tipoLive: "audio" | "video" = "audio"
  ) {
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade.");
      return;
    }

    if (!motivo) {
      alert("Escolha o motivo da visita.");
      return;
    }

    try {
      setDiagnostico("");

      // Mantem o QrCall normal exatamente como ja funciona.
      await chamarUnidade(
        tipoLive
      );

      const chamadaRef =
        ref(
          db,
          `unidades-v2/${unidadeSelecionada.id}/chamada`
        );

      let chamadaAtual:
        | Record<string, any>
        | null = null;

      for (
        let tentativa = 0;
        tentativa < 20;
        tentativa++
      ) {
        const snapshot =
          await get(chamadaRef);

        const dados =
          snapshot.val();

        if (
          dados?.criadoEm &&
          dados?.status !== "Encerrado"
        ) {
          chamadaAtual = dados;
          break;
        }

        await new Promise((resolver) =>
          setTimeout(resolver, 150)
        );
      }

      const criadoEm =
        String(
          chamadaAtual?.criadoEm || ""
        );

      if (!criadoEm) {
        throw new Error(
          "Identidade da chamada nao encontrada."
        );
      }

      const criadoMs =
        Date.parse(criadoEm);

      if (!Number.isFinite(criadoMs)) {
        throw new Error(
          "Identidade da chamada invalida."
        );
      }

      const sessaoRef =
        ref(
          db,
          `qrcall-live/${unidadeSelecionada.id}/${String(criadoMs)}`
        );

      const agora =
        Date.now();

      // Somente convite.
      // Microfone e WebRTC continuam desligados.
      await set(
        sessaoRef,
        {
          unidadeId:
            unidadeSelecionada.id,

          criadoEm,

          sessaoId:
            String(criadoMs),

          tipo: tipoLive,

          estado:
            "solicitando",

          iniciadaPor:
            "visitante",

          criadaEmMs:
            agora,

          atualizadaEmMs:
            agora,
        }
      );
      // QRCALL_A9_12_PREVIEW_JA_PRONTO
      // O preview de video ja foi preparado dentro de chamarUnidade(),
      // antes do disparo do push. Nao recriar aqui.

      setMensagem(
        `${tipoLive === "video" ? "Ligacao de video" : "Ligacao de audio"} solicitada. Aguarde o morador atender.`
      );

      let pararSessao:
        | (() => void)
        | null = null;

      pararSessao =
        onValue(
          sessaoRef,
          (snapshot) => {
            const sessao =
              snapshot.val();

            if (!sessao) {
              return;
            }

            if (
              String(
                sessao.criadoEm || ""
              ) !== criadoEm
            ) {
              return;
            }

            if (sessao.estado === "aceita") {
              setMensagem(
                `${tipoLive === "video" ? "Morador aceitou a ligacao de video." : "Morador aceitou a ligacao de audio."}`
              );

              // QRCALL_AUDIO_REAL_VISITANTE_APOS_ACEITE
              // Microfone/WebRTC somente depois da confirmacao do morador.
              if (tipoLive === "video") {
                const previewAtual =
                  videoPreviewVisitanteRef.current;

                videoPreviewVisitanteRef.current =
                  null;

                void (
                  async () => {
                    if (previewAtual) {
                      await previewAtual
                        .encerrar();

                      /*
                       * Libera a camera antes da
                       * Live principal assumir.
                       */
                      await new Promise<void>(
                        (resolve) => {
                          window.setTimeout(
                            resolve,
                            150
                          );
                        }
                      );
                    }

                    await iniciarLiveVisitante(
                      unidadeSelecionada.id,
                      criadoEm,
                      tipoLive
                    );
                  }
                )();

              } else {
                void iniciarLiveVisitante(
                  unidadeSelecionada.id,
                  criadoEm,
                  tipoLive
                );
              }

              if (pararSessao) {
                pararSessao();
                pararSessao = null;
              }

              return;
            }

            if (sessao.estado === "recusada") {

              if (tipoLive === "video") {
                const previewAtual =
                  videoPreviewVisitanteRef.current;

                videoPreviewVisitanteRef.current =
                  null;

                if (previewAtual) {
                  void previewAtual
                    .encerrar();
                }
              }
              setMensagem(
                `${tipoLive === "video" ? "Morador preferiu continuar sem ligacao de video." : "Morador preferiu continuar sem ligacao de audio."}`
              );

              if (pararSessao) {
                pararSessao();
                pararSessao = null;
              }
            }
          }
        );
    } catch (erro) {
      console.error(
        "QRCALL_AUDIO_SOLICITACAO_VISITANTE:",
        erro
      );

      alert(
        "Nao foi possivel solicitar a ligacao de audio."
      );
    }
  }
  async function cancelarChamada() {
    const persistida =
      lerIdentidadeChamada();

    const unidadeIdCancelar =
      unidadeSelecionada?.id ||
      persistida?.unidadeId ||
      "";

    if (!unidadeIdCancelar) {
      alert(
        "Nao foi possivel localizar a chamada ativa."
      );
      return;
    }

    try {
      // QRCALL_A8_3B_CANCELAMENTO_MANUAL
      await encerrarPresencaVisitante(
        true
      );

      await encerrarLiveVisitante();

      const chamadaRef =
        ref(
          db,
          `unidades-v2/${unidadeIdCancelar}/chamada`
        );

      const snapshot =
        await get(chamadaRef);

      const chamadaAtual =
        snapshot.val();

      const criadoEmAtual =
        String(
          chamadaAtual?.criadoEm || ""
        );

      /*
       * Se a identidade salva for antiga, nunca
       * cancelar uma chamada nova da mesma unidade.
       */
      if (
        persistida &&
        persistida.unidadeId ===
          unidadeIdCancelar &&
        persistida.criadoEm &&
        criadoEmAtual &&
        persistida.criadoEm !==
          criadoEmAtual
      ) {
        limparIdentidadeChamada();

        alert(
          "A chamada anterior ja nao esta ativa."
        );

        return;
      }

      const criadoEmCancelar =
        persistida?.criadoEm ||
        criadoEmAtual;

      const criadoMs =
        Date.parse(
          criadoEmCancelar
        );

      if (Number.isFinite(criadoMs)) {
        try {
          await remove(
            ref(
              db,
              `qrcall-live/${unidadeIdCancelar}/${String(criadoMs)}`
            )
          );
        } catch (erroLive) {
          console.warn(
            "QRCALL_A8_1_LIMPAR_LIVE:",
            erroLive
          );
        }
      }

      if (chamadaAtual) {
        await update(
          chamadaRef,
          {
            status:
              "Cancelado pelo visitante",
            notificar: false,
            canceladoEm:
              Date.now(),
          }
        );

        await remove(
          chamadaRef
        );
      }

      limparIdentidadeChamada();

      setEnviando(false);
      setEnviandoAudio(false);
      setDiagnostico("");
      setBusca("");
      setBlocoSelecionado("");
      setMensagem("");
      setPopupTexto("");
      setPopupAudioBase64("");
      setPopupAudioFoiOuvido(false);
      setMensagensConversa([]);
      setUnidadeSelecionada(null);
      setNome("");
      setMotivo("");
      setOutroMotivo("");
      setAudioBlob(null);
      setGravandoAudio(false);
      setChamadaEmAtendimento(false);

      chamadaAtivaRef.current =
        false;

      chamadaFoiEnviadaRef.current =
        false;

      ultimoPopupRef.current =
        "";

    } catch (erro) {
      console.error(
        "Erro ao cancelar:",
        erro
      );

      alert(
        "Nao foi possivel cancelar a chamada. Tente novamente."
      );
    }
  }
  function limparSelecao() {
    setMensagensConversa([]);
    setPopupAudioFoiOuvido(false);
    setUnidadeSelecionada(
      localEhResidencia && unidades.length === 1 ? unidades[0] : null
    );
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setDiagnostico("");
    setPopupTexto("");
    setPopupAudioBase64("");
    setAudioBlob(null);
    setGravandoAudio(false);
    chamadaAtivaRef.current = false;
    chamadaFoiEnviadaRef.current = false;
    ultimoPopupRef.current = "";
  }

  function voltarBloco() {
    setMensagensConversa([]);
    setPopupAudioFoiOuvido(false);
    setBlocoSelecionado("");
    setBusca("");
    setUnidadeSelecionada(null);
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setDiagnostico("");
    setPopupTexto("");
    setPopupAudioBase64("");
    setAudioBlob(null);
    setGravandoAudio(false);
    chamadaAtivaRef.current = false;
    chamadaFoiEnviadaRef.current = false;
    ultimoPopupRef.current = "";
  }

  useEffect(() => {
    if (
      popupTipo !== "encerrado" ||
      !popupTexto
    ) {
      return;
    }

    const temporizador =
      setTimeout(() => {
        setPopupTexto("");
        setPopupAudioBase64("");
        setPopupAudioFoiOuvido(false);
      }, 2000);

    return () => {
      clearTimeout(
        temporizador
      );
    };
  }, [
    popupTipo,
    popupTexto,
  ]);

  async function responderConviteLive(
    aceitar: boolean
  ) {
    const convite =
      liveConvite;

    if (!convite) return;

    try {
      const sessaoId =
        String(
          Date.parse(
            convite.criadoEm
          )
        );

      await update(
        ref(
          db,
          `qrcall-live/${convite.unidadeId}/${sessaoId}`
        ),
        {
          estado:
            aceitar
              ? "aceita"
              : "recusada",

          atualizadaEmMs:
            Date.now(),
        }
      );

      setLiveConvite(
        null
      );

      // WebRTC ainda NAO inicia aqui.

    } catch (erro) {
      console.error(
        "QRCALL_LIVE_RESPOSTA_CONVITE:",
        erro
      );

      alert(
        "Nao foi possivel responder a solicitacao de ligacao."
      );
    }
  }
  return (
    <main className="min-h-screen bg-slate-950 text-white p-3 flex justify-center">
      {liveConvite && (
        <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-5">
          <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 text-center shadow-2xl">

            <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-black">
              QRCALL
            </div>

            <h2 className="mt-4 text-2xl font-black">
              {liveConvite.tipo === "video"
                ? "CHAMADA DE VIDEO"
                : "CHAMADA DE AUDIO"}
            </h2>

            <p className="mt-3 text-slate-300">
              O morador deseja falar com voce.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {liveConvite.tipo === "video"
                ? "Camera e microfone so serao solicitados se voce aceitar."
                : "O microfone so sera solicitado se voce aceitar."}
            </p>

            <button
              type="button"
              onClick={() => {
                void responderConviteLive(
                  true
                );
              }}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 rounded-2xl py-4 text-lg font-black"
            >
              ACEITAR
            </button>

            <button
              type="button"
              onClick={() => {
                void responderConviteLive(
                  false
                );
              }}
              className="w-full mt-3 bg-slate-700 hover:bg-slate-600 rounded-2xl py-3 font-bold"
            >
              CONTINUAR SEM LIGACAO
            </button>

          </div>
        </div>
      )}
      <audio
        ref={liveAudioRemotoRef}
        autoPlay
        playsInline
        className="hidden"
      />
      {popupTexto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5">
          <div
            className={
              popupTipo === "encerrado"
                ? "w-full max-w-xl bg-green-600 border-4 border-green-300 rounded-3xl p-8 text-center shadow-2xl"
                : "w-full max-w-xl bg-blue-600 border-4 border-blue-300 rounded-3xl p-8 text-center shadow-2xl"
            }
          >
            <p className="text-5xl mb-4">
              {popupTipo === "encerrado"
                ? "✅"
                : popupTipo === "audio"
                ? "🎧"
                : "💬"}
            </p>

            <h2 className="text-2xl font-black mb-3">
              {popupTipo === "encerrado"
                ? "ATENDIMENTO ENCERRADO"
                : popupTipo === "audio"
                ? "NOVO ÁUDIO"
                : "NOVA MENSAGEM"}
            </h2>

            <p className="text-2xl font-black leading-relaxed py-6">
              {popupTexto}
            </p>

            {popupTipo === "audio" && popupAudioBase64 && (
              <div className="bg-white/15 border border-white/30 rounded-2xl p-4 mb-4">
                <audio
                  controls
                  className="w-full"
                  src={popupAudioBase64}
                  onPlay={async () => {
                    setPopupAudioFoiOuvido(true);

                    if (!unidadeSelecionada) return;

                    await update(
                      ref(
                        db,
                        `unidades-v2/${unidadeSelecionada.id}/chamada`
                      ),
                      {
                        visualizadoPeloVisitante: true,
                        mensagemVisualizada: true,
                        audioOuvidoPeloVisitante: true,
                        audioOuvidoEm: Date.now(),
                      }
                    );
                  }}
                />
              </div>
            )}

            <button
              type="button"
              disabled={popupTipo === "audio" && !popupAudioFoiOuvido}
              onClick={async () => {
                if (popupTipo === "audio" && !popupAudioFoiOuvido) return;

                if (unidadeSelecionada) {
                  await update(
                    ref(
                      db,
                      `unidades-v2/${unidadeSelecionada.id}/chamada`
                    ),
                    {
                      visualizadoPeloVisitante: true,
                    }
                  );
                }

                setPopupTexto("");
                setPopupAudioBase64("");
                setPopupAudioFoiOuvido(false);
              }}
              className={
                popupTipo === "audio" && !popupAudioFoiOuvido
                  ? "mt-7 w-full bg-slate-500 text-slate-300 text-2xl font-black py-5 rounded-2xl cursor-not-allowed"
                  : "mt-7 w-full bg-white text-black text-2xl font-black py-5 rounded-2xl"
              }
            >
              {popupTipo === "audio" && !popupAudioFoiOuvido
                ? "OUÇA O ÁUDIO PRIMEIRO"
                : "ENTENDI"}
            </button>
          </div>
        </div>
      )}

      {popupAudioVisitanteAberto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-blue-500 rounded-3xl p-5 shadow-2xl">

            {!gravandoAudio && !enviandoAudio && (
              <button
                type="button"
                onClick={() => {
                  setAudioBlob(null);
                  setPopupAudioVisitanteAberto(false);
                }}
                className="absolute top-3 right-4 text-slate-400 hover:text-white text-3xl font-black"
              >
                &times;
              </button>
            )}

            <div className="text-center mb-5">
              <div className="text-5xl mb-3">
                {gravandoAudio ? "REC" : audioBlob ? "AUDIO" : "..."}
              </div>

              <h2 className="text-2xl font-black">
                {gravandoAudio
                  ? "GRAVANDO ÁUDIO"
                  : audioBlob
                  ? "ÁUDIO GRAVADO"
                  : "PREPARANDO MICROFONE"}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {gravandoAudio
                  ? "Fale normalmente e toque em parar quando terminar."
                  : audioBlob
                  ? "Confira o áudio e depois envie."
                  : "Aguarde a liberação do microfone."}
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
                  onClick={pararGravacao}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  &#9209; PARAR GRAVAÇÃO
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
                  onClick={enviarAudioVisitante}
                  disabled={enviandoAudio}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  {enviandoAudio ? "Enviando..." : "ENVIAR ÁUDIO"}
                </button>

                {!enviandoAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setAudioBlob(null);
                      iniciarGravacao();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-2xl"
                  >
                    GRAVAR NOVAMENTE
                  </button>
                )}

              </div>
            )}

            {!gravandoAudio && !audioBlob && (
              <div className="space-y-3">

                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center text-slate-300 font-bold">
                  Preparando microfone...
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPopupAudioVisitanteAberto(false);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-2xl"
                >
                  FECHAR
                </button>

              </div>
            )}

          </div>
        </div>
      )}

      <div className="w-full max-w-xl">

        <section className={chamadaVisualAtiva ? "hidden" : "bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-3 text-center"}>
          <p className="text-green-400 font-black text-xs mb-1">
            QR ACESSO • V2
          </p>

          <h1 className="text-2xl font-black">
            {localEhResidencia ? "🏠" : "🏢"} {" "}
            {localCadastro?.nome || "Chamar Unidade"}
          </h1>

          <p className="text-slate-400 mt-1 text-sm">
            {localEhResidencia
              ? "Informe o motivo da visita para chamar a residência."
              : "Escolha bloco, unidade e motivo da chamada."}
          </p>
        </section>

        {carregando && (
          <section className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
            <p className="text-slate-400">Carregando unidades...</p>
          </section>
        )}

        {!carregando &&
          !localEhResidencia &&
          temBlocos &&
          !blocoSelecionado && (
            <section className="bg-slate-900 border border-slate-700 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Escolha o bloco</h2>

              <div className="grid grid-cols-1 gap-3">
                {blocos.map((bloco) => (
                  <button
                    key={bloco}
                    onClick={() => setBlocoSelecionado(bloco)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl p-5 text-left"
                  >
                    <p className="text-2xl font-black">🏢 {bloco}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

        {!carregando &&
          !localEhResidencia &&
          (!temBlocos || blocoSelecionado) &&
          !unidadeSelecionada && (
            <section className="bg-slate-900 border border-slate-700 rounded-3xl p-5">
              {temBlocos && (
                <button
                  onClick={voltarBloco}
                  className={chamadaVisualAtiva ? "hidden" : "mb-3 text-sm text-slate-300 underline"}
                >
                  ← Trocar bloco
                </button>
              )}

              <h2 className="text-2xl font-black mb-4">Escolha a unidade</h2>

              <label className="text-sm text-slate-300 font-bold">
                Buscar unidade
              </label>

              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Ex: 101, casa 5, apto 202"
                className="w-full mt-2 mb-4 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-3 text-white outline-none focus:border-green-400"
              />

              {unidadesFiltradas.length > 0 ? (
                <div className="space-y-3">
                  {unidadesFiltradas.map((unidade) => {
                    const statusChamada = unidade.chamada?.status || "";
                    const temNome = unidade.chamada?.nome || "";
                    const temMotivo = unidade.chamada?.motivo || "";

                    const ocupada =
                      !!unidade.chamada &&
                      !!temNome &&
                      !!temMotivo &&
                      statusChamada !== "Encerrado" &&
                      statusChamada !== "Finalizado" &&
                      statusChamada !== "Cancelado pelo visitante" &&
                      statusChamada !== "Cancelada pelo visitante" &&
                      statusChamada !== "Atendimento encerrado";

                    return (
                      <button
                        key={unidade.id}
                        onClick={() => {
                          if (ocupada) return;
                          setUnidadeSelecionada(unidade);
                        }}
                        disabled={ocupada}
                        className={
                          ocupada
                            ? "w-full bg-slate-900 border border-yellow-500/40 rounded-2xl p-4 text-left opacity-70"
                            : "w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl p-4 text-left"
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xl font-black">
                              🏠 {unidade.nome}
                            </p>
                            <p className="text-sm text-slate-400">
                              {unidade.tipo || "Unidade"}
                            </p>
                          </div>

                          <span
                            className={
                              ocupada
                                ? "text-yellow-400 text-sm font-bold"
                                : "text-green-400 text-sm font-bold"
                            }
                          >
                            {ocupada ? "Em atendimento" : "Disponível"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-red-400 text-center py-8">
                  Nenhuma unidade encontrada.
                </p>
              )}
            </section>
          )}

        {unidadeSelecionada && (
          <section className="bg-slate-900 border border-green-500 rounded-3xl p-4">
            <button
              onClick={limparSelecao}
              className={chamadaVisualAtiva ? "hidden" : "mb-3 text-sm text-slate-300 underline"}
            >
              → {unidadeSelecionada.nome}
            </button>

            {chamadaVisualAtiva ? (
              <div className="mb-3 text-center">
                <span className="text-green-400 font-black text-lg">
                  🏠 {unidadeSelecionada.nome}
                </span>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-2xl p-3 mb-4">
                <p className="text-sm text-slate-400">Unidade selecionada</p>
                <h2 className="text-xl font-black text-green-400">
                  🏠 {unidadeSelecionada.nome}
                </h2>
                <p className="text-slate-400">
                  {unidadeSelecionada.tipo || "Unidade"}
                </p>
              </div>
            )}

            <p className={chamadaVisualAtiva ? "hidden" : "text-sm text-slate-300 font-bold mb-2"}>
              O que você precisa?
            </p>

            <div className={chamadaVisualAtiva ? "hidden" : "grid grid-cols-2 gap-2 mb-4"}>
              {["Visitante", "Entrega", "Entrega de comida", "Outros"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMotivo(item);
                      setMensagem("");
                    }}
                    className={
                      motivo === item
                        ? "bg-green-500 text-black font-black px-2 py-3 min-h-[72px] rounded-2xl"
                        : "bg-slate-800 text-white font-bold px-2 py-3 min-h-[72px] rounded-2xl border border-slate-600"
                    }
                  >
                    {item === "Visitante" && "👤 Visitante"}
                    {item === "Entrega" && "📦 Entrega / encomenda"}
                    {item === "Entrega de comida" && "🍔 Entrega de comida"}
                    {item === "Outros" && "✏️ Outros"}
                  </button>
                )
              )}
            </div>

            {!chamadaVisualAtiva && motivo === "Visitante" && (
              <>
                <label className="text-sm text-slate-300 font-bold">
                  Seu nome
                </label>
                <input
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full mt-2 mb-4 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-3 text-white outline-none focus:border-green-400"
                />
              </>
            )}

            {!chamadaVisualAtiva && motivo === "Outros" && (
              <>
                <label className="text-sm text-slate-300 font-bold">
                  Descreva o motivo
                </label>
                <input
                  value={outroMotivo}
                  onChange={(evento) => setOutroMotivo(evento.target.value)}
                  placeholder="Ex: reunião, manutenção, serviço..."
                  className="w-full mt-2 mb-4 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-3 text-white outline-none focus:border-green-400"
                />
              </>
            )}


            {/* QRCALL_VISUAL_4_BOTOES_OK */}
            <div className={chamadaVisualAtiva ? "hidden" : "mb-3 text-center"}>
              <p className="text-sm font-bold text-slate-300">
                Escolha o motivo e depois como deseja falar com o morador
              </p>
            </div>

            <button
              onClick={chamarUnidade}
              disabled={enviando || !motivo}
              className={chamadaVisualAtiva ? "hidden" : "w-full sticky bottom-2 z-40 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600 disabled:opacity-45 disabled:cursor-not-allowed text-white text-lg font-black py-3 rounded-2xl shadow-2xl transition"}
            >
              {enviando ? "Enviando..." : "ENVIAR MENSAGEM"}
            </button>

            {diagnostico && diagnostico !== "✅ Chamada enviada." && (
              <div
                className={
                  diagnostico.startsWith("❌")
                    ? "mt-5 bg-red-500/15 border border-red-500 rounded-2xl p-4 text-red-300 font-bold text-center break-words"
                    : diagnostico.startsWith("3/3")
                    ? "mt-5 bg-green-500/15 border border-green-500 rounded-2xl p-4 text-green-300 font-bold text-center"
                    : "mt-5 bg-yellow-500/15 border border-yellow-500 rounded-2xl p-4 text-yellow-200 font-bold text-center"
                }
              >
                {diagnostico}
              </div>
            )}

            {mensagem && (
              <div className="mt-5 space-y-4">
                {chamadaEmAtendimento ? (
                  <>
                    <div className="bg-blue-500/15 border border-blue-500 rounded-2xl p-3 text-blue-300 font-black text-center">
                      🟢 EM ATENDIMENTO
                    </div>

                    {(
                      mensagem
                        .toLowerCase()
                        .includes("ligacao de audio") ||
                      mensagem
                        .toLowerCase()
                        .includes("ligacao de video")
                    ) && (
                      <div className="bg-emerald-500/15 border border-emerald-500 rounded-2xl p-4 text-emerald-300 font-bold text-center">
                        {mensagem}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-green-500/15 border border-green-500 rounded-2xl p-4 text-green-300 font-bold text-center">
                    {mensagem}
                  </div>
                )}

                <button
                  onClick={cancelarChamada}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  ❌ CANCELAR CHAMADA
                </button>
              </div>
            )}

            {mensagensConversa.length > 0 && (
              <div className="mt-5 bg-slate-950 border border-slate-700 rounded-2xl p-4">
                <h3 className="text-lg font-black mb-4">💬 Conversa</h3>

                <div className="space-y-3">
                  {mensagensConversa.map((item) => {
                    const mensagemMorador = item.autor === "morador";

                    return (
                      <div
                        key={item.id}
                        className={
                          mensagemMorador
                            ? "flex justify-start"
                            : "flex justify-end"
                        }
                      >
                        <div
                          className={
                            mensagemMorador
                              ? "max-w-[88%] bg-blue-600 rounded-2xl rounded-bl-md p-3"
                              : "max-w-[88%] bg-green-600 text-black rounded-2xl rounded-br-md p-3"
                          }
                        >
                          <p className="text-xs font-black mb-2 opacity-80">
                            {mensagemMorador ? "Morador" : "Você"}
                          </p>

                          {item.tipo === "texto" && item.texto && (
                            <p className="font-bold break-words">{item.texto}</p>
                          )}

                          {item.tipo === "audio" && item.audioBase64 && (
                            <audio
                              controls
                              className="w-full min-w-[220px]"
                              src={item.audioBase64}
                              onPlay={async () => {
                                if (!unidadeSelecionada || !mensagemMorador) {
                                  return;
                                }

                                await update(
                                  ref(
                                    db,
                                    `unidades-v2/${unidadeSelecionada.id}/chamada`
                                  ),
                                  {
                                    visualizadoPeloVisitante: true,
                                    audioOuvidoPeloVisitante: true,
                                    audioOuvidoEm: Date.now(),
                                  }
                                );
                              }}
                            />
                          )}

                          {!mensagemMorador && (
                            <p
                              className={
                                item.tipo === "audio"
                                  ? item.audioOuvidoPeloMorador
                                    ? "text-xs text-green-400 font-bold mt-2 text-right"
                                    : "text-xs text-slate-400 font-bold mt-2 text-right"
                                  : item.visualizadoPeloMorador
                                  ? "text-xs text-green-400 font-bold mt-2 text-right"
                                  : "text-xs text-slate-400 font-bold mt-2 text-right"
                              }
                            >
                              {item.tipo === "audio"
                                ? item.audioOuvidoPeloMorador
                                  ? "✓✓ Ouvido"
                                  : "✓ Enviado"
                                : item.visualizadoPeloMorador
                                ? "✓✓ Lido"
                                : "✓ Enviado"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setPopupAudioVisitanteAberto(true);
                  iniciarGravacao();
                }}
                disabled={enviandoAudio || !motivo}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600 disabled:opacity-45 disabled:cursor-not-allowed text-white text-lg font-black py-3 rounded-2xl transition"
              >
                &#127908; GRAVAR ÁUDIO
              </button>
            </div>
            {/* QRCALL_MENU_VISITANTE_AUDIO_VIDEO */}
            <div className="mt-3 space-y-3">

              <button
                type="button"
                onClick={() => {
                  void solicitarLigacaoVisitante("audio");
                }}
                disabled={!motivo}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600 disabled:opacity-45 disabled:cursor-not-allowed text-white text-lg font-black py-3 rounded-2xl transition"
              >
                LIGACAO DE AUDIO
              </button>

              <button
                type="button"
                onClick={() => {
                  void solicitarLigacaoVisitante("video");
                }}
                disabled={!motivo}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600 disabled:opacity-45 disabled:cursor-not-allowed text-white text-lg font-black py-3 rounded-2xl transition"
              >
                LIGACAO DE VIDEO
              </button>

            </div>
          </section>
        )}
      </div>
    </main>
  );
}












