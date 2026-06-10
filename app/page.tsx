"use client";

import { useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "./services/firebase";

export default function Home() {
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [chamando, setChamando] = useState(false);

  const cliente = {
    local: "Residencial Bela Vista",
    mensagem: "Escaneie o QR Code para chamar o responsável 🚀",
    slogan: "Atendimento remoto • Seguro • Rápido",
  };

  const codigoQr = "residencial-bela-vista";

  async function chamarResponsavel() {
    if (!nome.trim()) {
      alert("Digite seu nome antes de chamar.");
      return;
    }

    if (!motivo.trim()) {
      alert("Digite o motivo da visita antes de chamar.");
      return;
    }

    const novaSolicitacao = {
      nome,
      motivo,
      status: "Aguardando atendimento",
      criadoEm: new Date().toISOString(),
    };

    await set(ref(db, "solicitacaoAtual"), novaSolicitacao);

    setChamando(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md text-center bg-slate-900 p-8 rounded-2xl shadow-lg">
        <h1 className="text-5xl font-bold mb-2">🏠 QR Porteiro</h1>

        <p className="text-slate-400 mb-6">
          Seu porteiro digital inteligente
        </p>

        <p className="text-green-400 mb-6">{cliente.mensagem}</p>

        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-400 mb-3">QR Code do Cliente</p>

          <div className="bg-white w-40 h-40 mx-auto rounded-lg flex items-center justify-center">
            <div className="text-black text-xs leading-3 font-bold">
              ⬛⬛⬛⬛⬛
              <br />
              ⬛⬜⬛⬜⬛
              <br />
              ⬛⬛⬜⬛⬛
              <br />
              ⬛⬜⬛⬜⬛
              <br />
              ⬛⬛⬛⬛⬛
            </div>
          </div>
        </div>

        <p className="text-slate-300 mb-2">Você está chamando:</p>

        <h2 className="text-2xl font-semibold mb-2">{cliente.local}</h2>

        <p className="text-slate-400 mb-6">
          Toque no botão abaixo para iniciar o atendimento.
        </p>

        <input
          type="text"
          placeholder="Digite seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={chamando}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white text-black"
        />

        <input
          type="text"
          placeholder="Motivo da visita"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={chamando}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white text-black"
        />

        <button
          onClick={chamarResponsavel}
          disabled={chamando}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          {chamando ? "CHAMANDO..." : "CHAMAR"}
        </button>

        <p className="text-xs text-slate-500 mt-6">{cliente.slogan}</p>

        {chamando && (
          <div className="mt-6 bg-green-900/30 border border-green-500 rounded-xl p-4">
            <p className="text-green-400 font-bold">
              🔔 Solicitação enviada!
            </p>

            <p className="text-sm text-slate-300 mt-2">
              Aguarde. O responsável foi notificado.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}