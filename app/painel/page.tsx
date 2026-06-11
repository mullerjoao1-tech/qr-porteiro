"use client";

import { useEffect, useRef, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../services/firebase";

export default function Painel() {
  const [nome, setNome] = useState("Nenhuma solicitação");
  const [motivo, setMotivo] = useState("Aguardando visitante");
  const [status, setStatus] = useState("Sem chamado ativo");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [historicoNome, setHistoricoNome] = useState("");
  const [historicoMotivo, setHistoricoMotivo] = useState("");

  useEffect(() => {
    const referencia = ref(db, "solicitacaoAtual");

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

     if (dados) {
  setNome(dados.nome);
  setMotivo(dados.motivo);
  setStatus(dados.status);

  if (dados.notificar) {
    console.log("🔔 Novo evento para notificação");

    if (audioRef.current) {
      audioRef.current.play();
    }
  }

} else {
  setNome("Nenhuma solicitação");
  setMotivo("Aguardando visitante");
  setStatus("Sem chamado ativo");
}
    });

    return () => pararDeOuvir();
  }, []);

  async function atenderSolicitacao() {
    await update(ref(db, "solicitacaoAtual"), {
      status: "Em atendimento",
    });
  }

  async function finalizarSolicitacao() {
    setHistoricoNome(nome);
    setHistoricoMotivo(motivo);

    await remove(ref(db, "solicitacaoAtual"));

    setNome("Nenhuma solicitação");
    setMotivo("Aguardando visitante");
    setStatus("Sem chamado ativo");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <audio ref={audioRef} src="/alerta.mp3" />
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">🏠 Painel do Morador</h1>

        <p className="text-slate-400 mb-6">Solicitações recebidas</p>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <h2 className="font-bold text-green-400">🔔 {nome}</h2>

          <p className="text-sm text-slate-300 mt-2">Motivo: {motivo}</p>

          <p className="text-sm text-yellow-400 mt-2">Status: {status}</p>

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