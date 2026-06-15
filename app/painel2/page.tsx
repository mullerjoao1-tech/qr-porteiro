"use client";
import { useEffect, useRef, useState } from "react";
import { getToken } from "firebase/messaging";
import { ref, onValue, update, remove } from "firebase/database";
import { db, messagingPromise } from "../services/firebase";

export default function Painel() {
  const [nome, setNome] = useState("Nenhuma solicitação");
  const [motivo, setMotivo] = useState("Aguardando visitante");
  const [status, setStatus] = useState("Sem chamado ativo");
  const [horaChamada, setHoraChamada] = useState("");
  const [modo, setModo] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervaloSomRef = useRef<NodeJS.Timeout | null>(null);
  const [historicoNome, setHistoricoNome] = useState("");
  const [historicoMotivo, setHistoricoMotivo] = useState("");

  useEffect(() => {
const referencia = ref(db, "qr2");
const pararDeOuvir = onValue(referencia, (snapshot) => {
  const dados = snapshot.val();
console.log("DADOS DO PAINEL2:", dados);
  if (!dados) {
    setNome("Nenhuma solicitação");
    setMotivo("Aguardando visitante");
    setStatus("Sem chamado ativo");
    setHoraChamada("");
    setModo(""); 

    pararToqueContinuo();
    return;
  }

  setNome(dados.nome);
  setMotivo(dados.motivo);
  setStatus(dados.status);
  setHoraChamada(
  dados.criadoEm
    ? new Date(dados.criadoEm).toLocaleString("pt-BR")
    : ""
);
  setModo(dados.modo || "");

  const deveTocar =
    dados.notificar === true && dados.status === "Aguardando atendimento";

  if (deveTocar) {
    iniciarToqueContinuo();
  } else {
    pararToqueContinuo();
  }

  console.log("🔔 Novo evento para notificação");
});

return () => {
  pararToqueContinuo();
  pararDeOuvir();
};

    return () => pararDeOuvir();
  }, []);

 async function atenderSolicitacao() {
  if (status === "Sem chamado ativo") {
    alert("Não existe chamada ativa para atender.");
    return;
  }

await update(ref(db, "qr2"), {
  status: "Em atendimento",
});
await update(ref(db, "qr2"), {
  status: "Em atendimento",
});

pararToqueContinuo();
}


  async function finalizarSolicitacao() {
    setHistoricoNome(nome);
    setHistoricoMotivo(motivo);

    await remove(ref(db, "qr2"));

        setNome("Nenhuma solicitação");
    setMotivo("Aguardando visitante");
    setStatus("Sem chamado ativo");
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
  if (intervaloSomRef.current) {
    return;
  }

  testarSom();

  intervaloSomRef.current = setInterval(() => {
    testarSom();
  }, 800);
}async function ativarNotificacoes() {
  const messaging = await messagingPromise;

  if (!messaging) {
    alert("Este navegador não suporta notificações.");
    return;
  }

  const permissao = await Notification.requestPermission();
console.log("Permissão recebida:", permissao);
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

  console.log("Token do aparelho:", token);

  await update(ref(db, "configuracoes"), {
  tokenMorador2: token,
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
          <h2 className="font-bold text-green-400">🔔 {nome}</h2>

          <p className="text-sm text-slate-300 mt-2">Motivo: {motivo}</p>
<p className="text-sm text-cyan-400 mt-2">
  Modo: {modo === "porteiro" ? "Portaria" : "Direto para morador"}
</p>
          <p className="text-sm text-yellow-400 mt-2">Status: {status}</p>
<p className="text-sm text-blue-300 mt-2">
  Horário: {horaChamada}
</p>
          <button
            onClick={atenderSolicitacao}
            className="w-full mt-4 bg-green-500 text-black font-bold py-2 rounded-xl"
          >
            ATENDER
          </button>

          <hr className="border-slate-700 my-6" />

          <h3 className="text-2xl font-bold mb-4">📋 Histórico</h3>

          {historicoNome ? (
            <p className="text-green-400 text-sm">
              Último atendimento: {historicoNome} - {historicoMotivo}
            </p>
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