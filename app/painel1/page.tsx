"use client";

import { useEffect, useRef, useState } from "react";
import { getToken } from "firebase/messaging";
import { ref, onValue, update, remove, push, set } from "firebase/database";
import { db, messagingPromise } from "../services/firebase";

export default function Painel() {
  const [nome, setNome] = useState("Nenhuma solicitação");
  const [motivo, setMotivo] = useState("Aguardando visitante");
  const [status, setStatus] = useState("Sem chamado ativo");
  const [horaChamada, setHoraChamada] = useState("");
  const [modo, setModo] = useState("");
  const [mensagemResponsavel, setMensagemResponsavel] = useState("");
  const [historicoLista, setHistoricoLista] = useState<any[]>([]);
  const [avisoAuto, setAvisoAuto] = useState("");
  const [online, setOnline] = useState(true);
  const [fotoCameraAtualizadaEm, setFotoCameraAtualizadaEm] = useState(Date.now());
  const [capturandoCamera, setCapturandoCamera] = useState(false);

  const intervaloSomRef = useRef<NodeJS.Timeout | null>(null);
  const finalizacaoAutoRef = useRef<NodeJS.Timeout | null>(null);
  const ultimaCapturaCameraRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);

  const caminhoFirebase = "qr1";
  const caminhoHistorico = "historico/qr1";
  const caminhoStatus = "status/qr1";

  const TEMPO_AGUARDANDO = 5 * 60 * 1000;
  const TEMPO_EM_ATENDIMENTO = 3 * 60 * 1000;

  const chamadaAtiva =
    nome !== "Nenhuma solicitação" && status === "Aguardando atendimento";

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
  }, []);

  useEffect(() => {
    const referencia = ref(db, caminhoFirebase);

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

      limparFinalizacaoAutomatica();

      if (!dados) {
        setNome("Nenhuma solicitação");
        setMotivo("Aguardando visitante");
        setStatus("Sem chamado ativo");
        setHoraChamada("");
        setModo("");
        setMensagemResponsavel("");
        setAvisoAuto("");
        pararToqueContinuo();
        return;
      }

      setNome(dados.nome || "Nenhuma solicitação");
      setMotivo(dados.motivo || "Aguardando visitante");
      setStatus(dados.status || "Sem chamado ativo");
      setHoraChamada(
        dados.criadoEm ? new Date(dados.criadoEm).toLocaleString("pt-BR") : ""
      );
      setModo(dados.modo || "");
      setMensagemResponsavel(dados.mensagemResponsavel || "");

      if (dados.status === "Encerrado") {
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
  }, []);

  async function capturarFotoCamera() {
    setCapturandoCamera(true);

    try {
      await fetch("/api/capturar-camera");
      setFotoCameraAtualizadaEm(Date.now());
    } catch (erro) {
      console.error("Erro ao capturar foto da câmera:", erro);
      alert("Erro ao atualizar foto da câmera.");
    }

    setCapturandoCamera(false);
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

    await salvarHistorico("Automática");

    await update(ref(db, caminhoFirebase), {
      status: "Encerrado",
      mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
      notificar: false,
      encerradoEm: new Date().toISOString(),
    });

    setTimeout(async () => {
      await remove(ref(db, caminhoFirebase));
    }, 5000);

    setNome("Nenhuma solicitação");
    setMotivo("Aguardando visitante");
    setStatus("Sem chamado ativo");
    setHoraChamada("");
    setModo("");
    setMensagemResponsavel("");
    setAvisoAuto("");
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

    await update(ref(db, caminhoFirebase), {
      status: "Em atendimento",
      mensagemResponsavel: mensagem,
      notificar: false,
      atendidoEm: new Date().toISOString(),
    });

    setMensagemResponsavel(mensagem);
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

    await salvarHistorico("Manual");

    limparFinalizacaoAutomatica();

    await update(ref(db, caminhoFirebase), {
      status: "Encerrado",
      mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
      notificar: false,
      encerradoEm: new Date().toISOString(),
    });

    setTimeout(async () => {
      await remove(ref(db, caminhoFirebase));
    }, 5000);

    setNome("Nenhuma solicitação");
    setMotivo("Aguardando visitante");
    setStatus("Sem chamado ativo");
    setHoraChamada("");
    setModo("");
    setMensagemResponsavel("");
    setAvisoAuto("");

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
    await set(ref(db, "portao/qr1"), {
      acionado: true,
      acionadoEm: new Date().toISOString(),
    });

    alert("🚪 Portão acionado com sucesso.");
  }

  async function ativarNotificacoes() {
    const messaging = await messagingPromise;

    if (!messaging) {
      alert("Este navegador não suporta notificações.");
      return;
    }

    const permissao = await Notification.requestPermission();

    if (permissao !== "granted") {
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

      await update(ref(db, "configuracoes"), {
        tokenMorador1: token,
      });

      alert("Notificações ativadas com sucesso!");
    } catch (erro) {
      console.error("Erro ao gerar token:", erro);
      alert("Erro ao gerar token. Veja o console.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 relative">
      {chamadaAtiva && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-4 border-green-400 rounded-3xl p-6 text-center shadow-2xl">
            <p className="text-6xl mb-4">🚨</p>

            <h2 className="text-3xl font-black text-green-400 mb-2">
              CHAMADA RECEBIDA
            </h2>

            <p className="text-xl font-bold text-white mt-4">{nome}</p>
            <p className="text-slate-300 mt-2">Motivo: {motivo}</p>
            <p className="text-yellow-400 mt-2 font-bold">Status: {status}</p>

            <div className="mt-4 bg-slate-800 rounded-xl p-3">
              <p className="text-green-400 text-sm font-bold mb-2">
                📷 Câmera Yoosee
              </p>

              <img
                src={`/camera-qr1.jpg?t=${fotoCameraAtualizadaEm}`}
                alt="Câmera do portão"
                className="w-full rounded-lg border border-slate-600"
              />
            </div>

            <button
              onClick={atenderSolicitacao}
              className="w-full mt-5 bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
            >
              ✅ ATENDER AGORA
            </button>

            <div className="mt-3 space-y-2">
  <button
    onClick={() =>
      enviarMensagemRapida("Aguarde um momento, por favor.")
    }
    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
  >
    💬 Aguarde um momento
  </button>

  <button
    onClick={() =>
      enviarMensagemRapida("Olá, entendi. Já estou descendo.")
    }
    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
  >
    🚶 Já estou descendo
  </button>

  <button
    onClick={() =>
      enviarMensagemRapida("Pode deixar na portaria, obrigado.")
    }
    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
  >
    📦 Pode deixar na portaria
  </button>

  <button
    onClick={() =>
      enviarMensagemRapida("Não estou em casa no momento.")
    }
    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
  >
    🏠 Não estou em casa
  </button>

  <button
    onClick={() =>
      enviarMensagemRapida("Estou indo retirar agora.")
    }
    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
  >
    🚶 Estou indo retirar
  </button>
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

      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">🏠 Painel do Morador 1</h1>

        <button
          onClick={tocarBip}
          className="w-full mt-4 mb-4 bg-blue-500 text-white font-bold py-2 rounded-xl"
        >
          🔊 Testar Som
        </button>

        <button
          onClick={ativarNotificacoes}
          className="w-full mt-2 mb-4 bg-yellow-500 text-black font-bold py-2 rounded-xl"
        >
          🔔 Ativar Notificações
        </button>

        <p className="text-slate-400 mb-6">Solicitações recebidas</p>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <h2 className="font-bold text-white mb-2">📷 Câmera do Portão</h2>

          <p className="text-green-400 text-sm font-bold">
            ✅ Foto capturada da câmera Yoosee
          </p>

          <img
            src={`/camera-qr1.jpg?t=${fotoCameraAtualizadaEm}`}
            alt="Câmera do portão"
            className="w-full rounded-lg border border-slate-600 mt-2"
          />

          <p className="text-slate-400 text-xs mt-2">
            Imagem capturada pelo RTSP da câmera.
          </p>

          <button
            onClick={capturarFotoCamera}
            className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl"
          >
            {capturandoCamera
              ? "📸 Atualizando..."
              : "📸 Atualizar foto da câmera"}
          </button>

          <button
            onClick={() =>
              (window.location.href =
                "rtsp://admin:teste123@192.168.15.13:554/onvif1")
            }
            className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl"
          >
            📹 Abrir câmera no VLC
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <p
            className={
              online ? "text-green-400 font-bold" : "text-red-400 font-bold"
            }
          >
            {online ? "🟢 Disponível" : "🔴 Ausente"}
          </p>

          <button
            onClick={alterarStatusOnline}
            className="w-full mt-3 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded-xl"
          >
            ALTERAR STATUS
          </button>

          <button
            onClick={acionarPortao}
            className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl"
          >
            🚪 ABRIR PORTÃO
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <h2 className="font-bold text-green-400">🔔 {nome}</h2>

          <p className="text-sm text-slate-300 mt-2">Motivo: {motivo}</p>

          <p className="text-sm text-cyan-400 mt-2">
            Modo: {modo === "porteiro" ? "Portaria" : "Direto para morador"}
          </p>

          <p className="text-sm text-yellow-400 mt-2">Status: {status}</p>

          <p className="text-sm text-blue-300 mt-2">Horário: {horaChamada}</p>

          {avisoAuto && (
            <p className="text-sm text-orange-300 mt-2">⏱ {avisoAuto}</p>
          )}

          <button
            onClick={atenderSolicitacao}
            className="w-full mt-4 bg-green-500 text-black font-bold py-2 rounded-xl"
          >
            ATENDER
          </button>

          <div className="mt-5 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="font-bold text-blue-300 mb-3">
              💬 Respostas rápidas
            </h3>

            <button
              onClick={() =>
                enviarMensagemRapida("Olá, entendi. Já estou descendo.")
              }
              className="w-full mb-2 bg-blue-600 text-white font-bold py-2 rounded-xl"
            >
              Já estou descendo
            </button>

            <button
              onClick={() =>
                enviarMensagemRapida("Aguarde um momento, por favor.")
              }
              className="w-full mb-2 bg-blue-600 text-white font-bold py-2 rounded-xl"
            >
              Aguarde um momento
            </button>

            <button
              onClick={() =>
                enviarMensagemRapida("Pode deixar na portaria, obrigado.")
              }
              className="w-full mb-2 bg-blue-600 text-white font-bold py-2 rounded-xl"
            >
              Pode deixar na portaria
            </button>

            <button
              onClick={() =>
                enviarMensagemRapida("Não estou em casa no momento.")
              }
              className="w-full mb-2 bg-blue-600 text-white font-bold py-2 rounded-xl"
            >
              Não estou em casa
            </button>

            <button
              onClick={() => enviarMensagemRapida("Estou indo retirar agora.")}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl"
            >
              Estou indo retirar
            </button>

            {mensagemResponsavel && (
              <p className="text-sm text-green-400 mt-3">
                Última mensagem enviada: {mensagemResponsavel}
              </p>
            )}
          </div>

          <hr className="border-slate-700 my-6" />

<div className="flex items-center justify-between mb-4">
  <h3 className="text-2xl font-bold">📋 Histórico</h3>

  <button
    onClick={limparHistorico}
    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
  >
    LIMPAR
  </button>
</div>
          {historicoLista.length > 0 ? (
            <div className="space-y-3">
              {historicoLista.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-3"
                >
                  <p className="text-green-400 text-sm font-bold">
                    {item.nome} - {item.motivo}
                  </p>

                  <p className="text-slate-400 text-xs mt-1">
                    Finalizado em: {item.finalizadoEmFormatado}
                  </p>

                  <p className="text-blue-300 text-xs mt-1">
                    Tipo: {item.tipoFinalizacao || "Não informado"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-400 text-sm">
              🔔 Nenhum atendimento finalizado
            </p>
          )}

          <button
            onClick={finalizarSolicitacao}
            className="w-full mt-6 bg-slate-500 text-white font-bold py-2 rounded-xl"
          >
            FINALIZAR
          </button>
        </div>
      </div>
    </main>
  );
}