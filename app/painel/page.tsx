/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function Painel() {
  const [nome, setNome] = useState("Nenhuma solicitação");
  const [motivo, setMotivo] = useState("Aguardando visitante");
  const [status, setStatus] = useState("Sem chamado ativo");
  const [historicoNome, setHistoricoNome] = useState("");
const [historicoMotivo, setHistoricoMotivo] = useState("");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem("solicitacaoAtual");

    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);

      setNome(dados.nome);
      setMotivo(dados.motivo);
      setStatus(dados.status);
    }
  }, []);

  function atenderSolicitacao() {
    setStatus("Em atendimento");
  }

  function finalizarSolicitacao() {
  setHistoricoNome(nome);
  setHistoricoMotivo(motivo);

  setNome("Nenhuma solicitação");
  setMotivo("Aguardando visitante");
  setStatus("Sem chamado ativo");
}

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
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
          <div className="mt-8 border-t border-slate-700 pt-6">
  <h2 className="text-xl font-bold mb-4">
    📋 Histórico
  </h2>

  <div className="bg-slate-800 rounded-xl p-4">
    <div className="text-sm">
  {historicoNome ? (
  <div className="text-sm">
    <p className="text-green-400 font-bold">
      🔔 {historicoNome}
    </p>

    <p className="text-slate-300">
      Motivo: {historicoMotivo}
    </p>

    <p className="text-yellow-400">
      Status: Finalizado
    </p>
  </div>
) : (
  <p className="text-green-400">
    🔔 Nenhum atendimento finalizado
  </p>
)}
</div>
  </div>
</div>

          <button
            onClick={finalizarSolicitacao}
            className="w-full mt-3 bg-slate-600 text-white font-bold py-2 rounded-xl"
          >
            FINALIZAR
          </button>
        </div>
      </div>
    </main>
  );
}