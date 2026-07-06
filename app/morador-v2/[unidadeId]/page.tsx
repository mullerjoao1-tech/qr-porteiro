"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getToken } from "firebase/messaging";
import { ref, onValue, set, update, remove, push, get } from "firebase/database";
import { db, messagingPromise } from "../../services/firebase";

type MensagemConversa = {
  id?: string;
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
};

type Chamada = {
  nome?: string;
  motivo?: string;
  status?: string;
  criadoEm?: string;
  atendidoEm?: string;
  encerradoEm?: string;
  audioBase64?: string;
  mensagemResponsavel?: string;
  ultimaAtividade?: number;
  enviadoEm?: number;
  notificar?: boolean;
  visualizadoPeloVisitante?: boolean;
  mensagens?: Record<string, MensagemConversa>;
};

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  chamada?: Chamada;
};

const TEMPO_AGUARDANDO_MS = 5 * 60 * 1000;
const TEMPO_EM_ATENDIMENTO_MS = 3 * 60 * 1000;

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string);
    };

    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function ordenarMensagens(mensagens?: Record<string, MensagemConversa>) {
  if (!mensagens) return [];

  return Object.entries(mensagens)
    .map(([id, mensagem]) => ({
      id,
      ...mensagem,
    }))
    .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
}

function chamadaEstaAtiva(chamada?: Chamada) {
  if (!chamada) return false;

  return (
    chamada.status === "Aguardando atendimento" ||
    chamada.status === "Em atendimento"
  );
}

function pegarTempoBase(chamada?: Chamada) {
  if (!chamada) return Date.now();

  if (chamada.ultimaAtividade) return chamada.ultimaAtividade;

  if (chamada.enviadoEm) return chamada.enviadoEm;

  if (chamada.atendidoEm) {
    const tempo = new Date(chamada.atendidoEm).getTime();
    if (!Number.isNaN(tempo)) return tempo;
  }

  if (chamada.criadoEm) {
    const tempo = new Date(chamada.criadoEm).getTime();
    if (!Number.isNaN(tempo)) return tempo;
  }

  return Date.now();
}

export default function MoradorV2Page() {
  const params = useParams();
  const unidadeId = String(
    params?.unidadeId ||
      params?.slug ||
      params?.id ||
      params?.unidade ||
      "qr1"
  );

  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [online, setOnline] = useState(true);
  const [mostrarPopupChamada, setMostrarPopupChamada] = useState(false);

  const [gravandoAudioMorador, setGravandoAudioMorador] = useState(false);
  const [audioRespostaBlob, setAudioRespostaBlob] = useState<Blob | null>(null);
  const [enviandoAudioMorador, setEnviandoAudioMorador] = useState(false);

  const [mostrarPopupAudio, setMostrarPopupAudio] = useState(false);
  const [ultimoAudioRecebido, setUltimoAudioRecebido] = useState<string | null>(
    null
  );

  const [fotoCameraAtual, setFotoCameraAtual] = useState("");
  const [fotoCameraAtualizadaEm, setFotoCameraAtualizadaEm] = useState(Date.now());
  const [capturandoCamera, setCapturandoCamera] = useState(false);

  const [abrindoPortao, setAbrindoPortao] = useState(false);
  const [statusPortao, setStatusPortao] = useState("");

  const [historicoLista, setHistoricoLista] = useState<any[]>([]);
  const [avisoAuto, setAvisoAuto] = useState("");

  const [instalavel, setInstalavel] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [visitanteVisualizou, setVisitanteVisualizou] = useState(false);

  const mediaRecorderMoradorRef = useRef<MediaRecorder | null>(null);
  const audioChunksMoradorRef = useRef<Blob[]>([]);

  const intervaloSomRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalizacaoAutoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ultimaChamadaRecebidaRef = useRef("");
  const ultimaChamadaAtivaRef = useRef(false);
  const ultimaChamadaDadosRef = useRef<Chamada | null>(null);

  const caminhoUnidade = `unidades-v2/${unidadeId}`;
  const caminhoChamada = `unidades-v2/${unidadeId}/chamada`;
  const caminhoHistorico = `historico-v2/${unidadeId}`;
  const caminhoStatus = `status-v2/${unidadeId}`;
  const caminhoLogs = `logs-v2/${unidadeId}`;
  const caminhoAnalytics = `analytics-v2/${unidadeId}`;

  const mensagensConversa = useMemo(() => {
    return ordenarMensagens(unidade?.chamada?.mensagens);
  }, [unidade?.chamada?.mensagens]);

  const chamadaAtiva = chamadaEstaAtiva(unidade?.chamada);

  const ultimoAudioVisitante = [...mensagensConversa]
    .reverse()
    .find((m) => m.autor === "visitante" && m.tipo === "audio");

  const respostasRapidas = [
    {
      texto: "Aguarde um momento",
      mensagem: "Aguarde um momento, por favor.",
      icone: "💬",
    },
    {
      texto: "Já estou indo",
      mensagem: "Olá, entendi. Já estou indo.",
      icone: "🚶",
    },
    {
      texto: "Pode deixar na portaria",
      mensagem: "Pode deixar na portaria, obrigado.",
      icone: "📦",
    },
    {
      texto: "Não estou em casa",
      mensagem: "Não estou em casa no momento.",
      icone: "🏠",
    },
    {
      texto: "Estou indo retirar",
      mensagem: "Estou indo retirar agora.",
      icone: "🚶",
    },
  ];

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setInstalavel(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    const referenciaStatus = ref(db, caminhoStatus);

    const pararDeOuvirStatus = onValue(referenciaStatus, (snapshot) => {
      const dados = snapshot.val();

      if (dados && typeof dados.online === "boolean") {
        setOnline(dados.online);
      }
    });

    return () => pararDeOuvirStatus();
  }, [caminhoStatus]);

  useEffect(() => {
    const referenciaHistorico = ref(db, caminhoHistorico);

    const pararDeOuvirHistorico = onValue(referenciaHistorico, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setHistoricoLista([]);
        return;
      }

      const lista = Object.values(dados) as any[];

      const listaOrdenada = lista
        .sort((a, b) => {
          const dataA = new Date(a.finalizadoEm || 0).getTime();
          const dataB = new Date(b.finalizadoEm || 0).getTime();
          return dataB - dataA;
        })
        .slice(0, 10);

      setHistoricoLista(listaOrdenada);
    });

    return () => pararDeOuvirHistorico();
  }, [caminhoHistorico]);

  useEffect(() => {
    const referencia = ref(db, caminhoUnidade);

    const pararDeOuvir = onValue(referencia, async (snapshot) => {
      const dados = snapshot.val();

      limparFinalizacaoAutomatica();

      if (!dados) {
        setUnidade(null);
        setCarregando(false);
        pararToqueContinuo();
        return;
      }

      const unidadeAtual: Unidade = {
        id: unidadeId,
        ...dados,
      };

      setUnidade(unidadeAtual);
      setCarregando(false);

      const chamada = unidadeAtual.chamada;

      if (!chamada) {
        if (ultimaChamadaAtivaRef.current && ultimaChamadaDadosRef.current) {
          await registrarAnalytics("falha");
          await registrarLog(
            "chamada_cancelada_visitante",
            "Visitante cancelou antes do atendimento"
          );

          await salvarHistoricoComDados(
            "Cancelada pelo visitante",
            ultimaChamadaDadosRef.current
          );
        }

        ultimaChamadaAtivaRef.current = false;
        ultimaChamadaDadosRef.current = null;
        setMostrarPopupChamada(false);
        setMostrarPopupAudio(false);
        setAvisoAuto("");
        setAudioRespostaBlob(null);
        pararToqueContinuo();
        return;
      }

      ultimaChamadaAtivaRef.current = true;
      ultimaChamadaDadosRef.current = chamada;
      setVisitanteVisualizou(chamada.visualizadoPeloVisitante === true);

      if (chamada.status === "Encerrado") {
        pararToqueContinuo();
        setAvisoAuto("Atendimento encerrado. Limpando em instantes.");
        return;
      }

      const deveTocar =
        chamada.notificar === true &&
        chamada.status === "Aguardando atendimento" &&
        online;

      if (deveTocar) {
        iniciarToqueContinuo();
        setMostrarPopupChamada(true);

        const idChamada = chamada.criadoEm || chamada.nome || "";

        if (idChamada && ultimaChamadaRecebidaRef.current !== idChamada) {
          ultimaChamadaRecebidaRef.current = idChamada;

          await registrarAnalytics("recebida");
          await registrarLog("chamada_recebida", "Nova chamada recebida no painel");

          capturarFotoCamera();
        }
      } else {
        pararToqueContinuo();
      }

      programarFinalizacaoAutomatica(chamada);
    });

    return () => {
      limparFinalizacaoAutomatica();
      pararToqueContinuo();
      pararDeOuvir();
    };
  }, [caminhoUnidade, unidadeId, online]);

  useEffect(() => {
    if (!mensagensConversa.length) return;

    const ultimo = [...mensagensConversa]
      .reverse()
      .find(
        (m) =>
          m.autor === "visitante" && m.tipo === "audio" && Boolean(m.audioBase64)
      );

    if (!ultimo?.id) return;

    if (ultimo.id !== ultimoAudioRecebido) {
      setUltimoAudioRecebido(ultimo.id);
      setMostrarPopupAudio(true);
    }
  }, [mensagensConversa, ultimoAudioRecebido]);

  async function registrarLog(tipo: string, detalhes: string) {
    try {
      const novoLog = push(ref(db, caminhoLogs));

      await set(novoLog, {
        tipo,
        detalhes,
        unidade: unidadeId,
        timestamp: new Date().toISOString(),
        statusAtual: unidade?.chamada?.status || "Sem chamado ativo",
        navegador:
          typeof navigator !== "undefined" ? navigator.userAgent : "indisponivel",
      });
    } catch (erro) {
      console.error("Erro ao salvar log:", erro);
    }
  }

  async function registrarAnalytics(evento: string) {
    try {
      const referencia = ref(db, caminhoAnalytics);
      const snapshot = await get(referencia);

      const dados = snapshot.val() || {
        recebidas: 0,
        atendidas: 0,
        finalizadas: 0,
        timeouts: 0,
        falhas: 0,
      };

      if (evento === "recebida") dados.recebidas++;
      if (evento === "atendida") dados.atendidas++;
      if (evento === "finalizada") dados.finalizadas++;
      if (evento === "timeout") dados.timeouts++;
      if (evento === "falha") dados.falhas++;

      await update(referencia, dados);
    } catch (erro) {
      console.error("Erro analytics:", erro);
    }
  }

  async function instalarApp() {
    if (!installPrompt) return;

    installPrompt.prompt();

    const escolha = await installPrompt.userChoice;

    if (escolha?.outcome === "accepted") {
      setInstalavel(false);
      setInstallPrompt(null);
    }
  }

  function tocarBip() {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const contexto = audioContextRef.current;
      const oscillator = contexto.createOscillator();
      const gain = contexto.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, contexto.currentTime);

      gain.gain.setValueAtTime(0.15, contexto.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        contexto.currentTime + 0.35
      );

      oscillator.connect(gain);
      gain.connect(contexto.destination);

      oscillator.start();
      oscillator.stop(contexto.currentTime + 0.35);
    } catch (erro) {
      console.error("Erro ao tocar bip:", erro);
    }
  }

  function iniciarToqueContinuo() {
    if (intervaloSomRef.current) return;

    tocarBip();

    intervaloSomRef.current = setInterval(() => {
      tocarBip();
    }, 1400);
  }

  function pararToqueContinuo() {
    if (intervaloSomRef.current) {
      clearInterval(intervaloSomRef.current);
      intervaloSomRef.current = null;
    }
  }

  async function testarSom() {
    tocarBip();
    await registrarLog("teste_som", "Morador testou o som do painel");
  }

  function limparFinalizacaoAutomatica() {
    if (finalizacaoAutoRef.current) {
      clearTimeout(finalizacaoAutoRef.current);
      finalizacaoAutoRef.current = null;
    }
  }

  function programarFinalizacaoAutomatica(chamada: Chamada) {
    if (!chamada || chamada.status === "Encerrado") return;

    const tempoLimite =
      chamada.status === "Em atendimento"
        ? TEMPO_EM_ATENDIMENTO_MS
        : TEMPO_AGUARDANDO_MS;

    const tempoBase = pegarTempoBase(chamada);
    const tempoPassado = Date.now() - tempoBase;
    const tempoRestante = tempoLimite - tempoPassado;

    if (tempoRestante <= 0) {
      finalizarAutomaticamente();
      return;
    }

    const minutos = Math.ceil(tempoRestante / 60000);
    setAvisoAuto(`Finalização automática em até ${minutos} min.`);

    finalizacaoAutoRef.current = setTimeout(() => {
      finalizarAutomaticamente();
    }, tempoRestante);
  }

  async function finalizarAutomaticamente() {
    if (!unidade?.chamada) return;

    pararToqueContinuo();
    limparFinalizacaoAutomatica();

    await registrarAnalytics("timeout");
    await registrarLog("timeout_atendimento", "Chamada finalizada automaticamente");

    await salvarHistorico("Automática");

    await update(ref(db, caminhoChamada), {
      status: "Encerrado",
      mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
      notificar: false,
      encerradoEm: new Date().toISOString(),
    });

    setTimeout(async () => {
      await remove(ref(db, caminhoChamada));
    }, 5000);
  }

  async function salvarHistoricoComDados(tipoFinalizacao: string, chamada: Chamada) {
    if (!chamada) return;

    const agora = new Date();

    const novoRegistro = {
      nome: chamada.nome || "Visitante",
      motivo: chamada.motivo || "Não informado",
      statusFinal: chamada.status || "Sem status",
      tipoFinalizacao,
      chamadoEm: chamada.criadoEm
        ? new Date(chamada.criadoEm).toLocaleString("pt-BR")
        : "",
      finalizadoEm: agora.toISOString(),
      finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
      fotoCamera: fotoCameraAtual || "",
      mensagens: chamada.mensagens || null,
    };

    const novoItem = push(ref(db, caminhoHistorico));
    await set(novoItem, novoRegistro);
  }

  async function salvarHistorico(tipoFinalizacao: string) {
    if (!unidade?.chamada) return;

    await salvarHistoricoComDados(tipoFinalizacao, unidade.chamada);
  }

  async function registrarMensagemConversa(
    dados: Omit<MensagemConversa, "criadoEm">
  ) {
    if (!unidade?.chamada) return;

    const idMensagem = String(Date.now());

    await set(ref(db, `unidades-v2/${unidade.id}/chamada/mensagens/${idMensagem}`), {
      ...dados,
      criadoEm: Date.now(),
    });

    await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
      ultimaAtividade: Date.now(),
      enviadoEm: Date.now(),
    });
  }

  async function atenderChamada() {
    if (!unidade?.chamada) {
      alert("Não existe chamada ativa para atender.");
      return;
    }

    pararToqueContinuo();
    limparFinalizacaoAutomatica();

    await update(ref(db, caminhoChamada), {
      status: "Em atendimento",
      atendidoEm: new Date().toISOString(),
      ultimaAtividade: Date.now(),
      notificar: false,
    });

    await registrarAnalytics("atendida");
    await registrarLog("chamada_atendida", "Chamada atendida pelo morador");

    setMostrarPopupChamada(false);
  }

  async function enviarMensagemRapida(texto: string) {
    if (!unidade?.chamada) return;

    await update(ref(db, caminhoChamada), {
      status: "Em atendimento",
      mensagemResponsavel: texto,
      atendidoEm: unidade.chamada.atendidoEm || new Date().toISOString(),
      ultimaAtividade: Date.now(),
      enviadoEm: Date.now(),
      visualizadoPeloVisitante: false,
      notificar: false,
    });

    await registrarMensagemConversa({
      autor: "morador",
      tipo: "texto",
      texto,
    });

    await registrarLog("mensagem_rapida", texto);
  }

  async function iniciarGravacaoMorador() {
    if (!unidade?.chamada) {
      alert("Nenhuma chamada ativa para responder.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      audioChunksMoradorRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksMoradorRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksMoradorRef.current, {
          type: "audio/webm",
        });

        setAudioRespostaBlob(blob);
        setGravandoAudioMorador(false);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderMoradorRef.current = recorder;
      recorder.start();

      setAudioRespostaBlob(null);
      setGravandoAudioMorador(true);

      setTimeout(() => {
        if (recorder.state === "recording") {
          pararGravacaoMorador();
        }
      }, 15000);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível acessar o microfone.");
      setGravandoAudioMorador(false);
    }
  }

  function pararGravacaoMorador() {
    if (
      mediaRecorderMoradorRef.current &&
      mediaRecorderMoradorRef.current.state === "recording"
    ) {
      mediaRecorderMoradorRef.current.stop();
    } else {
      setGravandoAudioMorador(false);
    }
  }

  async function enviarAudioMorador() {
    if (!unidade?.chamada) return;

    if (!audioRespostaBlob) {
      alert("Grave um áudio antes de enviar.");
      return;
    }

    try {
      setEnviandoAudioMorador(true);

      const audioBase64 = await blobParaBase64(audioRespostaBlob);

      await update(ref(db, caminhoChamada), {
        status: "Em atendimento",
        atendidoEm: unidade.chamada.atendidoEm || new Date().toISOString(),
        ultimaAtividade: Date.now(),
        enviadoEm: Date.now(),
        visualizadoPeloVisitante: false,
        notificar: false,
      });

      await registrarMensagemConversa({
        autor: "morador",
        tipo: "audio",
        audioBase64,
      });

      await registrarLog("audio_morador", "Morador enviou áudio ao visitante");

      setAudioRespostaBlob(null);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao enviar áudio.");
    } finally {
      setEnviandoAudioMorador(false);
    }
  }

  async function finalizarChamada() {
    if (!unidade?.chamada) return;

    pararToqueContinuo();
    limparFinalizacaoAutomatica();

    await registrarAnalytics("finalizada");
    await registrarLog("chamada_finalizada", "Chamada finalizada pelo morador");

    await salvarHistorico("Manual pelo morador");

    await update(ref(db, caminhoChamada), {
      status: "Encerrado",
      mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
      notificar: false,
      encerradoEm: new Date().toISOString(),
      ultimaAtividade: Date.now(),
    });

    setTimeout(async () => {
      await remove(ref(db, caminhoChamada));
    }, 5000);

    setAudioRespostaBlob(null);
    setMostrarPopupChamada(false);
    setMostrarPopupAudio(false);
  }

  async function capturarFotoCamera() {
    setCapturandoCamera(true);

    try {
      await registrarLog("camera_tentativa", "Tentando capturar foto da câmera");

      const resposta = await fetch(`/api/capturar-camera?cache=${Date.now()}`);
      const dados = await resposta.json();

      if (dados.sucesso && dados.imagem) {
        setFotoCameraAtual(dados.imagem);
        setFotoCameraAtualizadaEm(Date.now());

        await registrarLog("camera_sucesso", "Foto da câmera capturada");
      } else {
        await registrarLog("erro_camera", "A câmera não retornou imagem válida");
      }
    } catch (erro) {
      console.error("Erro ao capturar foto da câmera:", erro);
      await registrarLog("erro_camera", "Erro ao atualizar foto: " + String(erro));
      alert("Erro ao atualizar foto da câmera.");
    } finally {
      setCapturandoCamera(false);
    }
  }

  async function acionarPortao() {
    setAbrindoPortao(true);
    setStatusPortao("⏳ Enviando comando para o portão...");

    try {
      const resposta = await fetch("/api/abrir-portao", {
        method: "POST",
      });

      const dados = await resposta.json();

      if (dados.sucesso || dados.success) {
        setStatusPortao("✅ Portão acionado com sucesso.");
        await registrarLog("portao_aberto", "Morador acionou o portão");
      } else {
        setStatusPortao("❌ Falha ao abrir o portão.");
        await registrarLog("erro_portao", JSON.stringify(dados));
      }
    } catch (erro) {
      setStatusPortao("❌ Erro ao comunicar com o portão.");
      await registrarLog("erro_portao", "Erro inesperado: " + String(erro));
      console.error("Erro ao abrir portão:", erro);
    } finally {
      setTimeout(() => {
        setAbrindoPortao(false);
        setStatusPortao("");
      }, 7000);
    }
  }

  async function alterarStatusOnline() {
    const novoStatus = !online;

    await update(ref(db, caminhoStatus), {
      online: novoStatus,
      atualizadoEm: new Date().toISOString(),
    });

    setOnline(novoStatus);

    await registrarLog(
      "status_online",
      novoStatus ? "Morador ficou disponível" : "Morador ficou ausente"
    );
  }

  async function ativarNotificacoes() {
    const messaging = await messagingPromise;

    if (!messaging) {
      await registrarLog(
        "push_nao_suportado",
        "Este navegador não suporta notificações"
      );

      alert("Este navegador não suporta notificações.");
      return;
    }

    const permissao = await Notification.requestPermission();

    if (permissao !== "granted") {
      await registrarLog(
        "push_permissao_negada",
        "Permissão para notificações negada: " + permissao
      );

      alert("Permissão para notificações negada. Resultado: " + permissao);
      return;
    }

    try {
      const registroServiceWorker = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      const token = await getToken(messaging, {
        vapidKey:
          "BIEIQutWLbP05G1xFN1Zvg_hMnc4OGOkHRf6yI1bT8Igfmm1G8vRjYQhZyDGc5M3X6yhHkoWdJj4a_atPGqX7sk",
        serviceWorkerRegistration: registroServiceWorker,
      });

      await update(ref(db, "configuracoes-v2"), {
        [`tokensMorador/${unidadeId}`]: token,
      });

      await registrarLog("push_token_salvo", "Token de notificação salvo");

      alert("Notificações ativadas com sucesso!");
    } catch (erro) {
      console.error("Erro ao gerar token:", erro);

      await registrarLog(
        "push_erro_token",
        "Erro ao gerar token: " + String(erro)
      );

      alert("Erro ao gerar token. Veja o console.");
    }
  }

  const horaChamada = unidade?.chamada?.criadoEm
    ? new Date(unidade.chamada.criadoEm).toLocaleString("pt-BR")
    : "";

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
          <p className="text-slate-400">Carregando painel do morador...</p>
        </div>
      </main>
    );
  }

  if (!unidade) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-700 rounded-3xl p-8 text-center max-w-xl">
          <h1 className="text-3xl font-black text-red-400 mb-3">
            Unidade não encontrada
          </h1>
          <p className="text-slate-400">
            Verifique se o link do morador está correto.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      {mostrarPopupAudio && ultimoAudioVisitante?.audioBase64 && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6">
          <div className="bg-cyan-700 border-4 border-cyan-300 rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl">
            <div className="text-5xl mb-3">🎤</div>

            <h2 className="text-4xl font-black mb-5">NOVO ÁUDIO</h2>

            <div className="bg-cyan-600 rounded-2xl p-4 mb-6">
              <p className="font-black text-xl mb-3">
                Novo áudio enviado pelo visitante
              </p>

              <audio
                controls
                className="w-full"
                src={ultimoAudioVisitante.audioBase64}
                onPlay={async () => {
                  if (unidade.chamada?.status === "Aguardando atendimento") {
                    await atenderChamada();
                  }
                }}
              />
            </div>

            <button
              onClick={() => setMostrarPopupAudio(false)}
              className="w-full bg-white text-black py-4 rounded-2xl text-2xl font-black"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}

      {mostrarPopupChamada && unidade.chamada && (
        <div className="fixed inset-0 bg-black/80 z-[900] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-green-400 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-center">
            <p className="text-6xl mb-3">🔔</p>

            <h2 className="text-3xl font-black text-green-300">
              NOVA CHAMADA
            </h2>

            <p className="text-xl font-black mt-4">
              {unidade.chamada.nome || "Visitante"}
            </p>

            <p className="text-slate-300 mt-2">
              Motivo: {unidade.chamada.motivo || "Não informado"}
            </p>

            {ultimoAudioVisitante?.audioBase64 && (
              <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 mt-5">
                <p className="text-sm font-black text-blue-300 mb-3">
                  🎙️ Áudio do visitante
                </p>

                <audio
                  controls
                  className="w-full"
                  src={ultimoAudioVisitante.audioBase64}
                  onPlay={async () => {
                    if (unidade.chamada?.status === "Aguardando atendimento") {
                      await atenderChamada();
                    }
                  }}
                />
              </div>
            )}

            <div className="grid gap-3 mt-6">
              <button
                onClick={atenderChamada}
                className="w-full bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
              >
                ✅ ATENDER
              </button>

              <button
                onClick={() => setMostrarPopupChamada(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xl font-black py-4 rounded-2xl"
              >
                VER PAINEL
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto">
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 mb-5">
          <p className="text-green-400 font-black text-sm mb-2">
            QR ACESSO • MORADOR V2
          </p>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-5xl font-black">
                🏠 {unidade.nome}
              </h1>

              <p className="text-slate-400 mt-1">
                Painel do morador para atendimento, mensagens, áudio e acesso.
              </p>
            </div>

            <div
              className={
                online
                  ? "bg-green-500/10 border border-green-500/40 text-green-400 text-xs font-bold px-3 py-2 rounded-xl"
                  : "bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-2 rounded-xl"
              }
            >
              {online ? "🟢 Disponível" : "🔴 Ausente"}
            </div>
          </div>

          {instalavel && (
            <button
              onClick={instalarApp}
              className="w-full mt-4 bg-green-500 hover:bg-green-400 text-black text-sm font-black py-3 rounded-2xl"
            >
              📲 INSTALAR APP NO CELULAR
            </button>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <button
              onClick={alterarStatusOnline}
              className={
                online
                  ? "bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black"
                  : "bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black"
              }
            >
              {online ? "🟢 Ativo" : "🔴 Ausente"}
            </button>

            <button
              onClick={testarSom}
              className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-black"
            >
              🔊 Som
            </button>

            <button
              onClick={ativarNotificacoes}
              className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black"
            >
              🔔 Push
            </button>

            <button
              onClick={capturarFotoCamera}
              disabled={capturandoCamera}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 py-3 rounded-xl font-black"
            >
              {capturandoCamera ? "📸..." : "📷 Câmera"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={acionarPortao}
              disabled={abrindoPortao}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-black py-3 rounded-xl"
            >
              {abrindoPortao ? "⏳ Abrindo" : "🚪 Abrir portão"}
            </button>

            <button
              onClick={() => setMostrarPopupChamada(!!unidade.chamada)}
              disabled={!unidade.chamada}
              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-black font-black py-3 rounded-xl"
            >
              🔔 Popup chamada
            </button>
          </div>

          {statusPortao && (
            <p className="mt-3 text-center text-green-400 font-bold">
              {statusPortao}
            </p>
          )}
        </section>

        {fotoCameraAtual && (
          <section className="bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-5">
            <h2 className="font-bold text-white mb-3">📷 Câmera do Portão</h2>

            <img
              src={`${fotoCameraAtual}?t=${fotoCameraAtualizadaEm}`}
              alt="Câmera do portão"
              className="w-full rounded-xl border border-slate-600"
            />
          </section>
        )}

        <section
          className={
            chamadaAtiva
              ? "bg-slate-900 border border-yellow-500 rounded-3xl p-5"
              : "bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center"
          }
        >
          {!chamadaAtiva && (
            <>
              <p className="text-5xl mb-4">✅</p>
              <h2 className="text-2xl font-black text-green-300">
                Nenhuma chamada ativa
              </h2>
              <p className="text-slate-400 mt-2">
                Quando alguém chamar esta unidade, o atendimento aparecerá aqui.
              </p>
            </>
          )}

          {chamadaAtiva && unidade.chamada && (
            <>
              <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-green-500/20">
                <p className="text-green-400 font-black text-2xl">
                  🔔 {unidade.chamada.nome || "Visitante"}
                </p>

                <p className="text-slate-300 mt-2">
                  Motivo: {unidade.chamada.motivo || "Não informado"}
                </p>

                <p className="text-cyan-400 mt-2">
                  Modo: Direto para morador
                </p>

                <p className="text-yellow-400 mt-2">
                  Status: {unidade.chamada.status || "Sem status"}
                </p>

                {horaChamada && (
                  <p className="text-blue-300 mt-2">Horário: {horaChamada}</p>
                )}

                {avisoAuto && (
                  <p className="text-orange-300 mt-2">⏱ {avisoAuto}</p>
                )}
              </div>

              <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 mb-4">
                <p className="text-blue-300 font-black mb-3">
                  💬 Conversa do atendimento
                </p>

                {mensagensConversa.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    A conversa ainda não possui mensagens.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {mensagensConversa.map((item) => (
                      <div
                        key={item.id}
                        className={
                          item.autor === "morador"
                            ? "bg-green-600/30 border border-green-500 rounded-2xl p-3"
                            : "bg-blue-600/30 border border-blue-500 rounded-2xl p-3"
                        }
                      >
                        <p className="text-xs font-black mb-2">
                          {item.autor === "morador" ? "Você" : "Visitante"}
                        </p>

                        {item.tipo === "texto" && (
                          <p className="text-white font-bold">{item.texto}</p>
                        )}

                        {item.tipo === "audio" && item.audioBase64 && (
                          <audio
                            controls
                            className="w-full"
                            src={item.audioBase64}
                            onPlay={async () => {
                              if (
                                item.autor === "visitante" &&
                                unidade.chamada?.status ===
                                  "Aguardando atendimento"
                              ) {
                                await atenderChamada();
                              }
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {unidade.chamada.status === "Aguardando atendimento" && (
                  <button
                    onClick={atenderChamada}
                    className="w-full bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
                  >
                    ✅ ATENDER
                  </button>
                )}

                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                  <h3 className="font-bold text-blue-300 mb-3">
                    💬 Respostas rápidas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {respostasRapidas.map((item) => (
                      <button
                        key={item.texto}
                        onClick={() => enviarMensagemRapida(item.mensagem)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl"
                      >
                        {item.icone} {item.texto}
                      </button>
                    ))}
                  </div>

                  {unidade.chamada.mensagemResponsavel && (
                    <div className="mt-4 bg-slate-800 rounded-xl p-3 border border-slate-700">
                      <p className="text-sm text-green-400 font-bold">
                        Última mensagem enviada:
                      </p>
                      <p className="text-sm text-white mt-1">
                        {unidade.chamada.mensagemResponsavel}
                      </p>

                      <p
                        className={
                          visitanteVisualizou
                            ? "text-xs text-green-400 mt-2 font-bold"
                            : "text-xs text-yellow-400 mt-2 font-bold"
                        }
                      >
                        {visitanteVisualizou
                          ? "✅ Visitante visualizou"
                          : "⏳ Aguardando visitante visualizar"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 border border-blue-500/40 rounded-2xl p-4 space-y-3">
                  <button
                    onClick={
                      gravandoAudioMorador
                        ? pararGravacaoMorador
                        : iniciarGravacaoMorador
                    }
                    disabled={enviandoAudioMorador}
                    className={
                      gravandoAudioMorador
                        ? "w-full bg-red-600 py-4 rounded-xl font-black animate-pulse"
                        : "w-full bg-blue-600 py-4 rounded-xl font-black disabled:bg-slate-700"
                    }
                  >
                    {gravandoAudioMorador
                      ? "⏹️ Parar gravação"
                      : "🎙️ Gravar áudio para visitante"}
                  </button>

                  {audioRespostaBlob && (
                    <div className="space-y-3">
                      <audio
                        controls
                        className="w-full"
                        src={URL.createObjectURL(audioRespostaBlob)}
                      />

                      <button
                        onClick={enviarAudioMorador}
                        disabled={enviandoAudioMorador}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 py-4 rounded-xl font-black"
                      >
                        {enviandoAudioMorador
                          ? "Enviando..."
                          : "📤 Enviar áudio ao visitante"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={capturarFotoCamera}
                    disabled={capturandoCamera}
                    className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl"
                  >
                    {capturandoCamera ? "📸 Atualizando" : "📸 Câmera"}
                  </button>

                  <button
                    onClick={acionarPortao}
                    disabled={abrindoPortao}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl"
                  >
                    {abrindoPortao ? "⏳ Abrindo" : "🚪 Portão"}
                  </button>
                </div>

                <button
                  onClick={finalizarChamada}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  ❌ FINALIZAR ATENDIMENTO
                </button>
              </div>
            </>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-700 rounded-3xl p-4 mt-5">
          <h3 className="text-2xl font-black mb-4">📋 Histórico</h3>

          {historicoLista.length === 0 ? (
            <p className="text-slate-400 text-sm">
              Nenhum atendimento finalizado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {historicoLista.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3"
                >
                  <p className="font-black text-white">
                    {item.nome || "Visitante"} • {item.motivo || "Não informado"}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {item.tipoFinalizacao || "Finalização"} •{" "}
                    {item.finalizadoEmFormatado || ""}
                  </p>

                  {item.fotoCamera && (
                    <img
                      src={item.fotoCamera}
                      alt="Foto registrada no histórico"
                      className="w-full rounded-xl border border-slate-600 mt-3"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
