"use client";

import { useEffect, useState } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "../services/firebase";

export default function Home() {
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tipoChamada, setTipoChamada] = useState("entrega");
  const [chamando, setChamando] = useState(false);
  const [status, setStatus] = useState("");
  const [mensagemResponsavel, setMensagemResponsavel] = useState("");
  const [mostrarBalao, setMostrarBalao] = useState(false);
  const [mostrarEncerrado, setMostrarEncerrado] = useState(false);
  const [online, setOnline] = useState(true);
  const [moradorDisponivel, setMoradorDisponivel] = useState(true);
  const [fotoVisitante, setFotoVisitante] = useState("");

  const codigoQr = "qr1";
  const caminhoFirebase = "qr1";
  const chaveAtendimento = "atendimentoAtivoQr2";
  const modoCondominio = "porteiro";

  const tiposChamada = [
    { id: "entrega", label: "📦 Entrega" },
    { id: "visita", label: "👤 Visita" },
    { id: "prestador", label: "🔧 Prestador" },
    { id: "outro", label: "✍ Outro" },
  ];

  const cliente = {
    local: "QR Acesso",
    mensagem: "Controle inteligente de acesso",
    slogan: "Campainha virtual • Atendimento remoto • Segurança",
  };

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
    const referenciaStatus = ref(db, "status/qr1");

    const pararDeOuvirStatus = onValue(referenciaStatus, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setMoradorDisponivel(true);
        return;
      }

      setMoradorDisponivel(dados.online === true);
    });

    return () => pararDeOuvirStatus();
  }, []);

  useEffect(() => {
    const referencia = ref(db, caminhoFirebase);

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();
      const atendimentoAtivoSalvo =
        localStorage.getItem(chaveAtendimento) === "true";

      if (dados) {
        const novaMensagem = dados.mensagemResponsavel || "";

        if (novaMensagem === "ATENDIMENTO_ENCERRADO") {
          localStorage.removeItem(chaveAtendimento);

          setChamando(false);
          setStatus("");
          setMensagemResponsavel("");
          setMostrarBalao(false);
          setMostrarEncerrado(true);
          return;
        }

        localStorage.setItem(chaveAtendimento, "true");

        setChamando(true);
        setStatus(dados.status || "");
        setMensagemResponsavel(novaMensagem);
        setMostrarEncerrado(false);

        if (novaMensagem) {
          setMostrarBalao(true);
        }

        return;
      }

      if (atendimentoAtivoSalvo) {
        setMostrarEncerrado(true);
      }

      localStorage.removeItem(chaveAtendimento);

      setChamando(false);
      setStatus("");
      setMensagemResponsavel("");
      setMostrarBalao(false);
    });

    return () => pararDeOuvir();
  }, []);

  async function chamarResponsavel() {
    if (!online) {
      alert("Sem conexão com a internet. Verifique o sinal e tente novamente.");
      return;
    }

    if (!nome.trim()) {
      alert("Digite seu nome antes de chamar.");
      return;
    }

    if (!tipoChamada) {
      alert("Selecione o tipo de atendimento.");
      return;
    }

    if (tipoChamada === "outro" && !motivo.trim()) {
      alert("Digite o motivo do atendimento.");
      return;
    }

    const tipoSelecionado =
      tiposChamada.find((item) => item.id === tipoChamada)?.label || "Outro";

    const motivoFinal =
      tipoChamada === "outro" ? motivo.trim() : tipoSelecionado;

    const novaSolicitacao = {
      nome: nome.trim(),
      motivo: motivoFinal,
      tipoChamada,
      tipoChamadaLabel: tipoSelecionado,
      modo: modoCondominio,
      status: "Aguardando atendimento",
      mensagemResponsavel: "",
      notificar: true,
      fotoVisitante,
      criadoEm: new Date().toISOString(),
    };

    setMostrarEncerrado(false);
    localStorage.setItem(chaveAtendimento, "true");

    await set(ref(db, caminhoFirebase), novaSolicitacao);

    await fetch("/api/enviar-push", {
      method: "POST",
      body: JSON.stringify({ canal: codigoQr }),
    });

    setChamando(true);
    setStatus("Aguardando atendimento");
    setMensagemResponsavel("");
    setMostrarBalao(false);
  }

  async function cancelarChamada() {
    localStorage.removeItem(chaveAtendimento);

    await set(ref(db, caminhoFirebase), null);

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
    setTipoChamada("entrega");
    setFotoVisitante("");
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

    <div className="bg-slate-800 rounded-xl p-4 mb-6 flex flex-col items-center">
  <img
    src="/logo-oficial.png"
    alt="QR Acesso"
    className="h-32 w-auto object-contain"
  />
</div>

        <p className="text-sm text-slate-400 mb-4">
          Modo de atendimento:{" "}
          {modoCondominio === "porteiro" ? "Portaria" : "Direto para o morador"}
        </p>

        <p className="mb-4">Você está chamando:</p>

        <div
          className={`mb-4 rounded-xl px-4 py-3 font-bold ${
            moradorDisponivel
              ? "bg-green-900/40 border border-green-500 text-green-300"
              : "bg-red-900/40 border border-red-500 text-red-300"
          }`}
        >
          {moradorDisponivel
            ? "🟢 Morador disponível"
            : "🔴 Morador ausente no momento"}
        </div>

        
  


        <p className="text-slate-300 mb-6">
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

        <div className="mb-4 text-left">
          <p className="text-sm text-slate-300 mb-2">Tipo de atendimento</p>

          <div className="grid grid-cols-2 gap-2">
            {tiposChamada.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                disabled={chamando}
                onClick={() => setTipoChamada(tipo.id)}
                className={`rounded-xl px-3 py-3 text-sm font-bold border ${
                  tipoChamada === tipo.id
                    ? "bg-green-500 text-black border-green-300"
                    : "bg-slate-800 text-white border-slate-600"
                }`}
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {tipoChamada === "outro" && (
          <input
            type="text"
            placeholder="Digite o motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={chamando}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-white text-black"
          />
        )}

        <div className="mb-4 text-left">
          <p className="text-sm text-slate-300 mb-2">
            📷 Foto do visitante (recomendado)
          </p>

          <input
            type="file"
            accept="image/*"
            capture="user"
            disabled={chamando}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];

              if (!arquivo) return;

              const url = URL.createObjectURL(arquivo);

              setFotoVisitante(url);
            }}
            className="w-full text-sm"
          />

          {fotoVisitante && (
            <div className="mt-3">
              <p className="text-green-400 text-sm mb-2">✅ Foto selecionada</p>

              <img
                src={fotoVisitante}
                alt="Visitante"
                className="w-32 h-32 object-cover rounded-xl border border-green-500"
              />
            </div>
          )}
        </div>

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