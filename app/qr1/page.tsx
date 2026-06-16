"use client";

import { useEffect, useState } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "../services/firebase";

export default function Home() {
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [chamando, setChamando] = useState(false);
  const [status, setStatus] = useState("");
  const [mensagemResponsavel, setMensagemResponsavel] = useState("");
  const [mostrarBalao, setMostrarBalao] = useState(false);
  const [mostrarEncerrado, setMostrarEncerrado] = useState(false);
  const [online, setOnline] = useState(true);
  const [primeiraLeitura, setPrimeiraLeitura] = useState(true);

  const cliente = {
    local: "QR Acesso",
    mensagem: "Controle inteligente de acesso",
    slogan: "Campainha virtual • Atendimento remoto • Segurança",
  };

  const codigoQr = "qr1";
  const modoCondominio = "porteiro";

  useEffect(() => {
    setOnline(navigator.onLine);

    function ficouOnline() {
      setOnline(true);
    }

    function ficouOffline() {
      setOnline(false);
    }

    window.addEventListener("online", ficouOnline);
    window.addEventListener("offline", ficouOffline);

    return () => {
      window.removeEventListener("online", ficouOnline);
      window.removeEventListener("offline", ficouOffline);
    };
  }, []);

  useEffect(() => {
    const referencia = ref(db, "qr1");

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();
      const atendimentoAtivoSalvo =
        localStorage.getItem("atendimentoAtivoQr1") === "true";

      if (dados) {
        const novaMensagem = dados.mensagemResponsavel || "";

        localStorage.setItem("atendimentoAtivoQr1", "true");

        setChamando(true);
        setStatus(dados.status || "");
        setMensagemResponsavel(novaMensagem);
        setMostrarEncerrado(false);

        if (novaMensagem) {
          setMostrarBalao(true);
        }
      } else {
        if (!primeiraLeitura && atendimentoAtivoSalvo) {
          setMostrarEncerrado(true);
        }

        localStorage.removeItem("atendimentoAtivoQr1");

        setChamando(false);
        setStatus("");
        setMensagemResponsavel("");
        setMostrarBalao(false);
      }

      setPrimeiraLeitura(false);
    });

    return () => pararDeOuvir();
  }, [primeiraLeitura]);

  async function chamarResponsavel() {
    if (!online) {
      alert("Sem conexão com a internet. Verifique o sinal e tente novamente.");
      return;
    }

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
      mensagemResponsavel: "",
      notificar: true,
      criadoEm: new Date().toISOString(),
    };

    setMostrarEncerrado(false);
    localStorage.setItem("atendimentoAtivoQr1", "true");

    await set(ref(db, "qr1"), novaSolicitacao);

    await fetch("/api/enviar-push", {
      method: "POST",
      body: JSON.stringify({ canal: "qr1" }),
    });

    setChamando(true);
    setStatus("Aguardando atendimento");
    setMensagemResponsavel("");
    setMostrarBalao(false);
  }

  async function cancelarChamada() {
    localStorage.removeItem("atendimentoAtivoQr1");

    await set(ref(db, "qr1"), null);

    setChamando(false);
    setStatus("");
    setMensagemResponsavel("");
    setMostrarBalao(false);
    setMostrarEncerrado(false);
  }

  function fecharEncerrado() {
    setMostrarEncerrado(false);
    setNome("");
    setMotivo("");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      {mensagemResponsavel && mostrarBalao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-blue-600 border-2 border-blue-300 rounded-3xl p-6 shadow-2xl text-center">
            <p className="text-white font-bold text-2xl mb-2">
              💬 NOVA MENSAGEM
            </p>

            <p className="text-blue-100 text-sm mb-4">
              Resposta enviada pelo responsável
            </p>

            <p className="text-white text-3xl font-bold leading-snug">
              {mensagemResponsavel}
            </p>

            <button
              onClick={() => setMostrarBalao(false)}
              className="w-full mt-6 bg-white text-blue-700 font-bold py-3 rounded-xl"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}

      {mostrarEncerrado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-green-600 border-2 border-green-300 rounded-3xl p-6 shadow-2xl text-center">
            <p className="text-white font-bold text-2xl mb-2">
              ✅ ATENDIMENTO ENCERRADO
            </p>

            <p className="text-green-100 text-sm mb-4">
              Este atendimento foi finalizado automaticamente.
            </p>

            <p className="text-white text-xl font-bold leading-snug">
              Para chamar novamente, preencha os dados e toque em CHAMAR.
            </p>

            <button
              onClick={fecharEncerrado}
              className="w-full mt-6 bg-white text-green-700 font-bold py-3 rounded-xl"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 text-center">
        <div
          className={`mb-4 rounded-xl px-4 py-3 font-bold ${
            online
              ? "bg-green-900/40 border border-green-500 text-green-300"
              : "bg-red-900/40 border border-red-500 text-red-300"
          }`}
        >
          {online ? "🟢 Online" : "🔴 Sem conexão"}
        </div>

        {mensagemResponsavel && !mostrarBalao && (
          <div className="mb-6 bg-blue-900/40 border border-blue-400 rounded-xl p-4">
            <p className="text-blue-300 font-bold">
              💬 Mensagem do responsável:
            </p>
            <p className="text-white text-lg mt-2">{mensagemResponsavel}</p>
          </div>
        )}

        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-blue-300 text-sm mb-4">QR Code do Cliente</p>

          <div className="mx-auto w-40 h-40 bg-white rounded-lg flex items-center justify-center mb-2">
            <div className="grid grid-cols-5 gap-1">
              {codigoQr
                .split("")
                .slice(0, 25)
                .map((_, index) => (
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
          {modoCondominio === "porteiro" ? "Portaria" : "Direto para o morador"}
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
          disabled={chamando || !online}
          className={`w-full font-bold px-6 py-3 rounded-xl transition-all ${
            online
              ? "bg-green-500 hover:bg-green-400 text-black"
              : "bg-slate-600 text-slate-300"
          }`}
        >
          {!online
            ? "SEM CONEXÃO"
            : status === "Em atendimento"
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