"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getToken } from "firebase/messaging";
import { ref, onValue, update, remove, push, set, get } from "firebase/database";
import { db, messagingPromise } from "../../services/firebase";

export default function MoradorV2() {
  const params = useParams();
const slug = String(
  params?.unidadeId ||
  params?.slug ||
  params?.id ||
  params?.unidade ||
  "qr1"
);

  const [nome, setNome] = useState("Nenhuma solicitação");
  const [motivo, setMotivo] = useState("Aguardando visitante");
  const [status, setStatus] = useState("Sem chamado ativo");
  const [horaChamada, setHoraChamada] = useState("");
  const [modo, setModo] = useState("");
  const [mensagemResponsavel, setMensagemResponsavel] = useState("");
  const [historicoLista, setHistoricoLista] = useState<any[]>([]);
  const [avisoAuto, setAvisoAuto] = useState("");
  const [online, setOnline] = useState(true);
  const [fotoCameraAtual, setFotoCameraAtual] = useState("");
  const [fotoCameraAtualizadaEm, setFotoCameraAtualizadaEm] = useState(Date.now());
  const [capturandoCamera, setCapturandoCamera] = useState(false);
  const [abrindoPortao, setAbrindoPortao] = useState(false);
  const [statusPortao, setStatusPortao] = useState("");
  const [visitanteVisualizou, setVisitanteVisualizou] = useState(false);

  const intervaloSomRef = useRef<NodeJS.Timeout | null>(null);
  const finalizacaoAutoRef = useRef<NodeJS.Timeout | null>(null);
  const ultimaCapturaCameraRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const ultimaChamadaAtivaRef = useRef(false);
  const ultimaChamadaDadosRef = useRef<any>(null);

  const caminhoFirebase = `unidades-v2/${slug}/chamada`;
  const caminhoHistorico = `historico-v2/${slug}`;
  const caminhoStatus = `status-v2/${slug}`;
  const caminhoLogs = `logs-v2/${slug}`;
  const caminhoAnalytics = `analytics-v2/${slug}`;

  const TEMPO_AGUARDANDO = 5 * 60 * 1000;
  const TEMPO_EM_ATENDIMENTO = 3 * 60 * 1000;

  const chamadaAtiva =
    nome !== "Nenhuma solicitação" && status === "Aguardando atendimento";

  async function registrarLog(tipo: string, detalhes: string) {
    try {
      const novoLog = push(ref(db, caminhoLogs));

      await set(novoLog, {
        tipo,
        detalhes,
        unidade: slug,
        timestamp: new Date().toISOString(),
        nomeAtual: nome,
        statusAtual: status,
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
    const referencia = ref(db, caminhoFirebase);

    const pararDeOuvir = onValue(referencia, async (snapshot) => {
      const dados = snapshot.val();

      limparFinalizacaoAutomatica();

      if (!dados) {
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

        setNome("Nenhuma solicitação");
        setMotivo("Aguardando visitante");
        setStatus("Sem chamado ativo");
        setHoraChamada("");
        setModo("");
        setMensagemResponsavel("");
        setVisitanteVisualizou(false);
        setAvisoAuto("");
        pararToqueContinuo();
        return;
      }

      ultimaChamadaAtivaRef.current = true;
      ultimaChamadaDadosRef.current = dados;

      setNome(dados.nome || "Nenhuma solicitação");
      setMotivo(dados.motivo || "Aguardando visitante");
      setStatus(dados.status || "Sem chamado ativo");
      setHoraChamada(
        dados.criadoEm ? new Date(dados.criadoEm).toLocaleString("pt-BR") : ""
      );
      setModo(dados.modo || "");
      setMensagemResponsavel(dados.mensagemResponsavel || "");
      setVisitanteVisualizou(
  dados.visualizadoPeloVisitante === true
);

      if (dados.status === "Encerrado") {
        ultimaChamadaAtivaRef.current = false;
        ultimaChamadaDadosRef.current = null;

        pararToqueContinuo();
        setAvisoAuto("Atendimento encerrado. Limpando em instantes.");
        return;
      }

      const deveTocar =
        dados.notificar === true && dados.status === "Aguardando atendimento";

      if (deveTocar) {
        iniciarToqueContinuo();

        const idChamada = dados.criadoEm || dados.nome || "";

        if (idChamada && ultimaCapturaCameraRef.current !== idChamada) {
          ultimaCapturaCameraRef.current = idChamada;

          registrarAnalytics("recebida");
          registrarLog("chamada_recebida", "Nova chamada recebida no painel");

          capturarFotoCamera();
        }
      } else {
        pararToqueContinuo();
      }

      programarFinalizacaoAutomatica(dados);
    });

    return () => {
      limparFinalizacaoAutomatica();
      pararToqueContinuo();
      pararDeOuvir();
    };
  }, [caminhoFirebase]);

  async function capturarFotoCamera() {
    setCapturandoCamera(true);

    try {
      await registrarLog("camera_tentativa", "Tentando capturar foto da câmera");

      const resposta = await fetch(`/api/capturar-camera?cache=${Date.now()}`);
      const dados = await resposta.json();

      if (dados.sucesso && dados.imagem) {
        setFotoCameraAtual(dados.imagem);
        setFotoCameraAtualizadaEm(Date.now());

        await registrarLog(
          "camera_sucesso",
          "Foto da câmera capturada com sucesso"
        );
      } else {
        await registrarLog("erro_camera", "A câmera não retornou imagem válida");
        console.log("A câmera não retornou imagem.");
      }
    } catch (erro) {
      console.error("Erro ao capturar foto da câmera:", erro);

      await registrarLog(
        "erro_camera",
        "Erro ao atualizar foto da câmera: " + String(erro)
      );

      alert("Erro ao atualizar foto da câmera.");
    }

    setCapturandoCamera(false);
  }

  async function salvarHistoricoComDados(tipoFinalizacao: string, dados: any) {
    if (!dados || !dados.nome) return;

    const agora = new Date();

    const novoRegistro = {
      nome: dados.nome || "Visitante",
      motivo: dados.motivo || "Não informado",
      modo: dados.modo || "",
      statusFinal: dados.status || "Sem status",
      tipoFinalizacao,
      chamadoEm: dados.criadoEm
        ? new Date(dados.criadoEm).toLocaleString("pt-BR")
        : "",
      finalizadoEm: agora.toISOString(),
      finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
      fotoCamera: fotoCameraAtual || "",
    };

    const novoItem = push(ref(db, caminhoHistorico));
    await set(novoItem, novoRegistro);
  }

  async function salvarHistorico(tipoFinalizacao: string) {
    if (nome === "Nenhuma solicitação") return;

    const agora = new Date();

    const novoRegistro = {
      nome,
      motivo,
      modo,
      statusFinal: status,
      tipoFinalizacao,
      chamadoEm: horaChamada,
      finalizadoEm: agora.toISOString(),
      finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
      fotoCamera: fotoCameraAtual || "",
    };

    const novoItem = push(ref(db, caminhoHistorico));
    await set(novoItem, novoRegistro);
  }

  function programarFinalizacaoAutomatica(dados: any) {
    if (dados.status === "Encerrado") return;

    const agora = Date.now();

    let tempoLimite = TEMPO_AGUARDANDO;
    let dataBase = dados.criadoEm;

    if (dados.status === "Em atendimento") {
      tempoLimite = TEMPO_EM_ATENDIMENTO;
      dataBase = dados.atendidoEm || dados.criadoEm;
    }

    if (!dataBase) return;

    const inicio = new Date(dataBase).getTime();
    const tempoPassado = agora - inicio;
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
    pararToqueContinuo();
    limparFinalizacaoAutomatica();

    ultimaChamadaAtivaRef.current = false;

    await registrarAnalytics("timeout");
    await registrarLog("timeout_atendimento", "Chamada finalizada automaticamente");

    await salvarHistorico("Automática");

    await update(ref(db, caminhoFirebase), {
      status: "Encerrado",
      mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
      notificar: false,
      encerradoEm: new Date().toISOString(),
    });

    ultimaChamadaDadosRef.current = null;

    setTimeout(async () => {
      await remove(ref(db, caminhoFirebase));
    }, 5000);
  }

  function limparFinalizacaoAutomatica() {
    if (finalizacaoAutoRef.current) {
      clearTimeout(finalizacaoAutoRef.current);
      finalizacaoAutoRef.current = null;
    }
  }

  async function atenderSolicitacao() {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para atender.");
      return;
    }

    if (status === "Em atendimento") {
      alert("Esta chamada já está em atendimento.");
      return;
    }

    await registrarAnalytics("atendida");
    await registrarLog("chamada_atendida", "Chamada atendida pelo painel");

    await update(ref(db, caminhoFirebase), {
      status: "Em atendimento",
      notificar: false,
      atendidoEm: new Date().toISOString(),
    });

    pararToqueContinuo();
  }

  async function enviarMensagemRapida(mensagem: string) {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para responder.");
      return;
    }

    if (status !== "Em atendimento") {
      await registrarAnalytics("atendida");
    }

    await registrarLog("mensagem_rapida", "Mensagem enviada: " + mensagem);

    await update(ref(db, caminhoFirebase), {
      status: "Em atendimento",
      mensagemResponsavel: mensagem,
      notificar: false,
     visualizadoPeloVisitante: false,
       enviadoEm: Date.now(),
      atendidoEm: new Date().toISOString(),
    });

    setMensagemResponsavel(mensagem);
    setVisitanteVisualizou(false);
    pararToqueContinuo();
  }

  async function limparHistorico() {
    const confirmar = window.confirm(
      "Tem certeza que deseja limpar todo o histórico?"
    );

    if (!confirmar) return;

    await remove(ref(db, caminhoHistorico));
    setHistoricoLista([]);
    alert("Histórico limpo com sucesso.");
  }

  async function finalizarSolicitacao() {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para finalizar.");
      return;
    }

    ultimaChamadaAtivaRef.current = false;

    await registrarAnalytics("finalizada");
    await registrarLog("chamada_finalizada", "Chamada finalizada manualmente");

    await salvarHistorico("Manual");

    limparFinalizacaoAutomatica();

    await update(ref(db, caminhoFirebase), {
      status: "Encerrado",
      mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
      notificar: false,
      encerradoEm: new Date().toISOString(),
    });

    ultimaChamadaDadosRef.current = null;

    setTimeout(async () => {
      await remove(ref(db, caminhoFirebase));
    }, 5000);

    pararToqueContinuo();
  }

  function tocarBip() {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.45
      );

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.45);
    } catch (erro) {
      console.error("Erro ao tocar bip:", erro);
    }
  }

  function iniciarToqueContinuo() {
    if (intervaloSomRef.current) return;

    tocarBip();

    intervaloSomRef.current = setInterval(() => {
      tocarBip();
    }, 900);
  }

  function pararToqueContinuo() {
    if (intervaloSomRef.current) {
      clearInterval(intervaloSomRef.current);
      intervaloSomRef.current = null;
    }
  }

  async function alterarStatusOnline() {
    const novoStatus = !online;

    setOnline(novoStatus);

    await set(ref(db, caminhoStatus), {
      online: novoStatus,
      atualizadoEm: new Date().toISOString(),
    });
  }

  async function acionarPortao() {
    if (abrindoPortao) return;

    try {
      setAbrindoPortao(true);
      setStatusPortao("⏳ Abrindo portão...");

      await registrarLog("portao_tentativa", "Tentativa de abertura do portão");

      const resposta = await fetch("/api/abrir-portao");
      const dados = await resposta.json();

      if (dados.success) {
        setStatusPortao("✅ Portão aberto com sucesso");
        await registrarLog("portao_sucesso", "Portão aberto com sucesso");
      } else {
        setStatusPortao("❌ Falha ao abrir portão");
        await registrarLog(
          "erro_portao",
          "API respondeu falha ao abrir portão"
        );
      }
    } catch (erro) {
      setStatusPortao("❌ Erro ao abrir portão");

      await registrarLog("erro_portao", "Erro inesperado: " + String(erro));

      console.error("Erro ao abrir portão:", erro);
    } finally {
      setTimeout(() => {
        setAbrindoPortao(false);
        setStatusPortao("");
      }, 7000);
    }
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

    alert("Permissão aceita. Agora vou gerar o token.");

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
        [`tokensMorador/${slug}`]: token,
      });

      await registrarLog(
        "push_token_salvo",
        "Token de notificação salvo com sucesso"
      );

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

  const respostasRapidas = [
    {
      texto: "Aguarde um momento",
      mensagem: "Aguarde um momento, por favor.",
      icone: "💬",
    },
    {
      texto: "Já estou descendo",
      mensagem: "Olá, entendi. Já estou descendo.",
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

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 relative">
      {chamadaAtiva && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border-4 border-green-400 rounded-3xl p-5 text-center shadow-2xl my-4">
            <p className="text-6xl mb-3">🚨</p>

            <h2 className="text-3xl font-black text-green-400 mb-2">
              CHAMADA RECEBIDA
            </h2>

            <div className="bg-slate-800 rounded-2xl p-4 mt-4 border border-green-500/30">
              <p className="text-2xl font-black text-white">{nome}</p>
              <p className="text-slate-300 mt-2">Motivo: {motivo}</p>
              <p className="text-yellow-400 mt-2 font-bold">Status: {status}</p>
            </div>

            <div className="mt-4 bg-slate-800 rounded-2xl p-3">
              <p className="text-green-400 text-sm font-bold mb-2">
                📷 Câmera do portão
              </p>

              {fotoCameraAtual ? (
                <img
                  src={`${fotoCameraAtual}?t=${fotoCameraAtualizadaEm}`}
                  alt="Câmera do portão"
                  className="w-full rounded-xl border border-slate-600"
                />
              ) : (
                <p className="text-slate-400 text-sm">Capturando imagem...</p>
              )}
            </div>

            <button
              onClick={atenderSolicitacao}
              className="w-full mt-5 bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
            >
              ✅ ATENDER AGORA
            </button>

            <div className="mt-3">
  <button
    onClick={capturarFotoCamera}
    disabled={capturandoCamera}
    className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-500 text-white text-sm font-bold py-3 rounded-2xl"
  >
    {capturandoCamera ? "📸 Atualizando" : "📸 Atualizar câmera"}
  </button>
</div>
                         

            {statusPortao && (
              <p className="mt-2 text-green-400 font-bold">{statusPortao}</p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-2">
              {respostasRapidas.map((item) => (
                <button
                  key={item.texto}
                  onClick={() => enviarMensagemRapida(item.mensagem)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
                >
                  {item.icone} {item.texto}
                </button>
              ))}
            </div>

            <button
              onClick={finalizarSolicitacao}
              className="w-full mt-3 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl"
            >
              ❌ FINALIZAR
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">🏠 Morador V2</h1>
            <p className="text-slate-400 text-sm mt-1">Unidade: {slug}</p>
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

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={tocarBip}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded-2xl"
          >
            🔊 Testar Som
          </button>

          <button
            onClick={ativarNotificacoes}
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold py-3 rounded-2xl"
          >
            🔔 Notificações
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={capturarFotoCamera}
            disabled={capturandoCamera}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-500 text-white text-sm font-bold py-3 rounded-2xl"
          >
            {capturandoCamera ? "📸 Atualizando" : "📸 Câmera"}
          </button>

          <button
            onClick={acionarPortao}
            disabled={abrindoPortao}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-500 text-white text-sm font-bold py-3 rounded-2xl"
          >
            {abrindoPortao ? "⏳ Abrindo" : "🚪 Portão"}
          </button>
        </div>

        {statusPortao && (
          <p className="mt-3 text-center text-green-400 font-bold">
            {statusPortao}
          </p>
        )}

        <div className="bg-slate-800 rounded-2xl p-4 mt-5 border border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={
                  online ? "text-green-400 font-bold" : "text-red-400 font-bold"
                }
              >
                {online ? "🟢 Atendimento ativo" : "🔴 Atendimento pausado"}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Use quando estiver disponível ou ausente.
              </p>
            </div>

            <button
              onClick={alterarStatusOnline}
              className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold px-3 py-2 rounded-xl"
            >
              ALTERAR
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 mt-4 border border-green-500/20">
          <h2 className="font-black text-green-400 text-xl">🔔 {nome}</h2>

          <p className="text-sm text-slate-300 mt-3">Motivo: {motivo}</p>

          <p className="text-sm text-cyan-400 mt-2">
            Modo: {modo === "porteiro" ? "Portaria" : "Direto para morador"}
          </p>

          <p className="text-sm text-yellow-400 mt-2">Status: {status}</p>

          {horaChamada && (
            <p className="text-sm text-blue-300 mt-2">Horário: {horaChamada}</p>
          )}

          {avisoAuto && (
            <p className="text-sm text-orange-300 mt-2">⏱ {avisoAuto}</p>
          )}

          <button
            onClick={atenderSolicitacao}
            className="w-full mt-4 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-2xl"
          >
            ✅ ATENDER
          </button>

          <div className="mt-4 bg-slate-900 border border-slate-700 rounded-2xl p-4">
            <h3 className="font-bold text-blue-300 mb-3">💬 Respostas rápidas</h3>

            {respostasRapidas.map((item) => (
              <button
                key={item.texto}
                onClick={() => enviarMensagemRapida(item.mensagem)}
                className="w-full mb-2 last:mb-0 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
              >
                {item.icone} {item.texto}
              </button>
            ))}

            {mensagemResponsavel && (
              <div className="mt-4 bg-slate-800 rounded-xl p-3 border border-slate-700">
                <p className="text-sm text-green-400 font-bold">
                  Última mensagem enviada:
                </p>
                <p className="text-sm text-white mt-1">{mensagemResponsavel}</p>

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

          <button
            onClick={finalizarSolicitacao}
            className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl"
          >
            ❌ FINALIZAR ATENDIMENTO
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 mt-4 border border-slate-700">
          <h2 className="font-bold text-white mb-3">📷 Câmera do Portão</h2>

          {fotoCameraAtual ? (
            <img
              src={`${fotoCameraAtual}?t=${fotoCameraAtualizadaEm}`}
              alt="Câmera do portão"
              className="w-full rounded-xl border border-slate-600"
            />
          ) : (
            <p className="text-slate-400 text-sm">Nenhuma foto capturada ainda.</p>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 mt-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black">📋 Histórico</h3>

            <button
              onClick={limparHistorico}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl"
            >
              LIMPAR
            </button>
          </div>

          {historicoLista.length > 0 ? (
            <div className="space-y-3">
              {historicoLista.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-700 rounded-2xl p-3"
                >
                  <p className="text-green-400 text-sm font-bold">
                    {item.nome} - {item.motivo}
                  </p>

                  {item.fotoCamera && (
                    <img
                      src={item.fotoCamera}
                      alt="Snapshot da câmera"
                      className="w-full mt-3 rounded-xl border border-slate-600"
                    />
                  )}

                  <p className="text-slate-400 text-xs mt-3">
                    Finalizado em: {item.finalizadoEmFormatado}
                  </p>

                  <p className="text-blue-300 text-xs mt-1">
                    Tipo: {item.tipoFinalizacao || "Não informado"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-400 text-sm">🔔 Nenhum atendimento finalizado</p>
          )}
        </div>
      </div>
    </main>
  );
}
