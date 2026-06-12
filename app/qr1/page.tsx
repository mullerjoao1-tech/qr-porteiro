"use client";

import { useEffect, useState } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "../services/firebase";

export default function Home() {
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [chamando, setChamando] = useState(false);
  const [status, setStatus] = useState("");

  const cliente = {
  local: "QR Acesso",
  mensagem: "Controle inteligente de acesso",
  slogan: "Campainha virtual • Atendimento remoto • Segurança",
};

  const codigoQr = "qr1";
  const modoCondominio = "porteiro";
// use "porteiro" para condomínio com portaria
// use "direto" para condomínio sem porteiro

  useEffect(() => {
    const referencia = ref(db, "qr1");

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

      if (dados) {
        setChamando(true);
        setStatus(dados.status || "");
      } else {
        setChamando(false);
        setStatus("");
      }
    });

    return () => pararDeOuvir();
  }, []);

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
  modo: modoCondominio,
  status: "Aguardando atendimento",
  notificar: true,
  criadoEm: new Date().toISOString(),
};

    await set(ref(db, "qr1"), novaSolicitacao);
    await fetch("/api/enviar-push", {
  method: "POST",
});

    setChamando(true);
    setStatus("Aguardando atendimento");
  }
async function cancelarChamada() {
  await set(ref(db, "qr1"), null);

  setChamando(false);
  setStatus("");
}
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 text-center">
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-blue-300 text-sm mb-4">QR Code do Cliente</p>

          <div className="mx-auto w-40 h-40 bg-white rounded-lg flex items-center justify-center mb-2">
            <div className="grid grid-cols-5 gap-1">
              {codigoQr.split("").slice(0, 25).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 ${
                    index % 2 === 0 ? "bg-black" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
<p className="text-sm text-slate-400 mb-4">
  Modo de atendimento:{" "}
  {modoCondominio === "porteiro"
    ? "Portaria"
    : "Direto para o morador"}
</p>
        <p className="mb-4">Você está chamando:</p>

        <h1 className="text-2xl font-bold mb-4">{cliente.local}</h1>

        <p className="text-slate-300 mb-6">
          Toque no botão abaixo para iniciar o atendimento.
        </p>

        <input
          type="text"
          placeholder="Seu nome"
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
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-all"
        >
          {status === "Em atendimento"
            ? "EM ATENDIMENTO"
            : chamando
            ? "CHAMANDO..."
            : "CHAMAR"}
        </button>
{chamando && (
  <button
    onClick={cancelarChamada}
    className="w-full mt-3 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl"
  >
    CANCELAR CHAMADA
  </button>
)}
        <p className="text-xs text-slate-500 mt-6">{cliente.slogan}</p>

        {status && (
          <div className="mt-6 bg-green-900/30 border border-green-500 rounded-xl p-4">
            <p className="text-green-400 font-bold">
              {status === "Em atendimento"
                ? "✅ O responsável está atendendo!"
                : "🔔 Solicitação enviada!"}
            </p>

            <p className="text-sm text-slate-300 mt-2">
              {status === "Em atendimento"
                ? "Aguarde. Seu atendimento foi iniciado."
                : "Aguarde. O responsável foi notificado."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}