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
  const [historicoLista, setHistoricoLista] = useState<any[]>([]);
  const [contadorHistorico, setContadorHistorico] = useState(0);
  const [contadorRecebidas, setContadorRecebidas] = useState(0);
const [online, setOnline] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervaloSomRef = useRef<NodeJS.Timeout | null>(null);

  const caminhoFirebase = "qr1";
const caminhoHistorico = "historico/qr1";
const caminhoStatus = "status/qr1";
  useEffect(() => {
    const referenciaHistorico = ref(db, caminhoHistorico);

    const pararDeOuvirHistorico = onValue(referenciaHistorico, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setHistoricoLista([]);
        setContadorHistorico(0);
        setContadorRecebidas(0);
        return;
      }

      const lista = Object.values(dados) as any[];

      setContadorHistorico(lista.length);
      setContadorRecebidas(lista.length);

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

      if (!dados) {
        setNome("Nenhuma solicitação");
        setMotivo("Aguardando visitante");
        setStatus("Sem chamado ativo");
        setHoraChamada("");
        setModo("");
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

      const deveTocar =
        dados.notificar === true && dados.status === "Aguardando atendimento";

      if (deveTocar) {
        iniciarToqueContinuo();
      } else {
        pararToqueContinuo();
      }
    });

    return () => {
      pararToqueContinuo();
      pararDeOuvir();
    };
  }, []);

  async function atenderSolicitacao() {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para atender.");
      return;
    }

    await update(ref(db, caminhoFirebase), {
      status: "Em atendimento",
      notificar: false,
    });

    pararToqueContinuo();
  }

  async function salvarHistorico() {
    if (nome === "Nenhuma solicitação") return;

    const agora = new Date();

    const novoRegistro = {
      nome,
      motivo,
      modo,
      statusFinal: status,
      chamadoEm: horaChamada,
      recebidoEm: agora.toISOString(),
      finalizadoEm: agora.toISOString(),
      finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
      tipoFinalizacao: "Manual",
    };

    const novoItem = push(ref(db, caminhoHistorico));
    await set(novoItem, novoRegistro);
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
  async function limparHistorico() {
    const confirmar = window.confirm(
      "Tem certeza que deseja limpar todo o histórico deste painel?"
    );

    if (!confirmar) return;

    await remove(ref(db, caminhoHistorico));

    setHistoricoLista([]);
    setContadorHistorico(0);
    setContadorRecebidas(0);

    alert("Histórico limpo com sucesso.");
  }

  async function finalizarSolicitacao() {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para finalizar.");
      return;
    }

    await salvarHistorico();

    await remove(ref(db, caminhoFirebase));

    setNome("Nenhuma solicitação");
    setMotivo("Aguardando visitante");
    setStatus("Sem chamado ativo");
    setHoraChamada("");
    setModo("");

    pararToqueContinuo();
  }

  function pararToqueContinuo() {
    if (intervaloSomRef.current) {
      clearInterval(intervaloSomRef.current);
      intervaloSomRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function iniciarToqueContinuo() {
    if (intervaloSomRef.current) return;

    testarSom();

    intervaloSomRef.current = setInterval(() => {
      testarSom();
    }, 800);
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

  function testarSom() {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">🏠 Painel do Morador</h1>

        <button
          onClick={testarSom}
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
  <h2 className="font-bold text-white mb-2">
    📹 Câmera do Portão
  </h2>

  <p className="text-green-400 text-sm font-bold">
    ✅ Câmera RTSP encontrada
  </p>

  <p className="text-slate-300 text-xs break-all mt-2">
    rtsp://192.168.15.13:554/onvif1
  </p>

  <button
    onClick={() =>
      (window.location.href =
        "rtsp://192.168.15.13:554/onvif1")
    }
    className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl"
  >
    📹 Abrir câmera no VLC
  </button>
</div>
<div className="bg-slate-800 rounded-xl p-4 mb-4">
  <p className={online ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
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

          <button
            onClick={atenderSolicitacao}
            className="w-full mt-4 bg-green-500 text-black font-bold py-2 rounded-xl"
          >
            ATENDER
          </button>

          <hr className="border-slate-700 my-6" />

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 mb-4">
            <p className="text-yellow-400 font-bold">
              🔔 Chamadas Recebidas: {contadorRecebidas}
            </p>

            <p className="text-green-400 font-bold mt-2">
              ✅ Chamadas Finalizadas: {contadorHistorico}
            </p>
          </div>

          <div className="flex items-center justify-between mb-2">
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