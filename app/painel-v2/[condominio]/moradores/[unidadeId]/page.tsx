"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ref, onValue, set, update, remove } from "firebase/database";
import { db } from "../../../../services/firebase";

type MensagemConversa = {
  id?: string;
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
};

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  chamada?: {
    nome?: string;
    motivo?: string;
    status?: string;
    criadoEm?: string;
    audioBase64?: string;
    mensagemResponsavel?: string;
    mensagens?: Record<string, MensagemConversa>;
  };
};

const unidadesIniciais: Unidade[] = [
  { id: "apto-101", nome: "Apto 101", tipo: "Apartamento" },
];

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

function ordenarMensagens(mensagens?: Record<string, MensagemConversa>) {
  if (!mensagens) return [];

  return Object.entries(mensagens)
    .map(([id, mensagem]) => ({
      id,
      ...mensagem,
    }))
    .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
}

export default function PainelV2Central() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [unidadeAberta, setUnidadeAberta] = useState<Unidade | null>(null);

  const [gravandoAudioMorador, setGravandoAudioMorador] = useState(false);
  const [audioRespostaBlob, setAudioRespostaBlob] = useState<Blob | null>(null);
  const [enviandoAudioMorador, setEnviandoAudioMorador] = useState(false);
const [mostrarPopupAudio, setMostrarPopupAudio] = useState(false);
const [ultimoAudioRecebido, setUltimoAudioRecebido] = useState<string | null>(null);
  const mediaRecorderMoradorRef = useRef<MediaRecorder | null>(null);
  const audioChunksMoradorRef = useRef<Blob[]>([]);

  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const referencia = ref(db, "unidades-v2");

    const pararDeOuvir = onValue(referencia, async (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        const objetoInicial: Record<string, Unidade> = {};

        unidadesIniciais.forEach((unidade) => {
          objetoInicial[unidade.id] = unidade;
        });

        await set(ref(db, "unidades-v2"), objetoInicial);
        setUnidades(unidadesIniciais);
        setCarregando(false);
        return;
      }

      const lista = Object.entries(dados).map(([id, valor]: any) => ({
        id,
        ...valor,
      })) as Unidade[];

      lista.sort((a, b) => a.nome.localeCompare(b.nome));

      setUnidades(lista);
      setCarregando(false);

      const unidadeChamando = lista.find(
        (u) => u.chamada?.status === "Aguardando atendimento"
      );

      if (unidadeChamando) {
        setTimeout(() => {
          cardRefs.current[unidadeChamando.id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 200);
      }

      setUnidadeAberta((unidadeAtual) => {
        if (unidadeAtual) {
          const unidadeAtualizada = lista.find((u) => u.id === unidadeAtual.id);
          return unidadeAtualizada || null;
        }

        return unidadeChamando || null;
      });
    });

    return () => pararDeOuvir();
  }, []);

  const unidadesFiltradas = useMemo(() => {
    if (filtro === "todos") return unidades;

    if (filtro === "chamando") {
      return unidades.filter(
        (u) => u.chamada?.status === "Aguardando atendimento"
      );
    }

    if (filtro === "atendimento") {
      return unidades.filter((u) => u.chamada?.status === "Em atendimento");
    }

    if (filtro === "livres") {
      return unidades.filter((u) => !u.chamada);
    }

    return unidades;
  }, [unidades, filtro]);

  const mensagensUnidadeAberta = useMemo(() => {
    return ordenarMensagens(unidadeAberta?.chamada?.mensagens);
  }, [unidadeAberta?.chamada?.mensagens]);
useEffect(() => {
  if (!mensagensUnidadeAberta.length) return;

  const ultimo = [...mensagensUnidadeAberta]
    .reverse()
    .find(
      (m) =>
        m.autor === "visitante" &&
        m.tipo === "audio" &&
        m.audioBase64
    );

  if (!ultimo) return;

  if (ultimo.id !== ultimoAudioRecebido) {
    setUltimoAudioRecebido(ultimo.id!);
    setMostrarPopupAudio(true);
  }
}, [mensagensUnidadeAberta]);
  const totalChamando = unidades.filter(
    (u) => u.chamada?.status === "Aguardando atendimento"
  ).length;

  const totalAtendimento = unidades.filter(
    (u) => u.chamada?.status === "Em atendimento"
  ).length;

  const totalLivres = unidades.filter((u) => !u.chamada).length;
const chamadasOrdenadas = [...unidades]
  .filter((u) => u.chamada?.status === "Aguardando atendimento")
  .sort(
    (a, b) =>
      new Date(a.chamada?.criadoEm || 0).getTime() -
      new Date(b.chamada?.criadoEm || 0).getTime()
  );

function prioridadeChamada(unidade: Unidade) {
  return chamadasOrdenadas.findIndex((u) => u.id === unidade.id) + 1;
}
  async function criarChamadaTeste(unidade: Unidade, motivo: string) {
    await update(ref(db, `unidades-v2/${unidade.id}`), {
      chamada: {
        nome: motivo === "Visitante" ? "Visitante teste" : motivo,
        motivo,
        status: "Aguardando atendimento",
        criadoEm: new Date().toISOString(),
      },
    });
  }

  async function atenderChamada(unidade: Unidade) {
  await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
    status: "Em atendimento",
    atendidoEm: new Date().toISOString(),
  });

  setUnidadeAberta(null);

  setTimeout(() => {
    cardRefs.current[unidade.id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 300);
}

  async function registrarMensagemConversa(
    unidadeId: string,
    dados: Omit<MensagemConversa, "criadoEm">
  ) {
    const idMensagem = String(Date.now());

    await set(ref(db, `unidades-v2/${unidadeId}/chamada/mensagens/${idMensagem}`), {
      ...dados,
      criadoEm: Date.now(),
    });

    await update(ref(db, `unidades-v2/${unidadeId}/chamada`), {
      ultimaAtividade: Date.now(),
      enviadoEm: Date.now(),
    });
  }

  async function enviarMensagem(unidade: Unidade, mensagem: string) {
  await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
    status: "Em atendimento",
    mensagemResponsavel: mensagem,
    atendidoEm: new Date().toISOString(),
    ultimaAtividade: Date.now(),
  });

  await registrarMensagemConversa(unidade.id, {
    autor: "morador",
    tipo: "texto",
    texto: mensagem,
  });

  setUnidadeAberta(null);

  setTimeout(() => {
    cardRefs.current[unidade.id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 300);
}

  async function iniciarGravacaoMorador() {
    if (!unidadeAberta?.chamada) {
      alert("Nenhuma chamada ativa para responder.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      audioChunksMoradorRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksMoradorRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksMoradorRef.current, {
          type: "audio/webm",
        });

        setAudioRespostaBlob(blob);
        setGravandoAudioMorador(false);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderMoradorRef.current = recorder;
      recorder.start();

      setAudioRespostaBlob(null);
      setGravandoAudioMorador(true);

      setTimeout(() => {
        if (recorder.state === "recording") {
          pararGravacaoMorador();
        }
      }, 15000);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível acessar o microfone.");
      setGravandoAudioMorador(false);
    }
  }

  function pararGravacaoMorador() {
    if (
      mediaRecorderMoradorRef.current &&
      mediaRecorderMoradorRef.current.state === "recording"
    ) {
      mediaRecorderMoradorRef.current.stop();
    } else {
      setGravandoAudioMorador(false);
    }
  }

  async function enviarAudioMorador(unidade: Unidade) {
    if (!audioRespostaBlob) {
      alert("Grave um áudio antes de enviar.");
      return;
    }

    try {
      setEnviandoAudioMorador(true);

      const audioBase64 = await blobParaBase64(audioRespostaBlob);

      await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
        status: "Em atendimento",
        atendidoEm: new Date().toISOString(),
        ultimaAtividade: Date.now(),
      });

      await registrarMensagemConversa(unidade.id, {
        autor: "morador",
        tipo: "audio",
        audioBase64,
      });

      setAudioRespostaBlob(null);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao enviar áudio.");
    } finally {
      setEnviandoAudioMorador(false);
    }
  }

  async function finalizarChamada(unidade: Unidade) {
    const chamada = unidade.chamada;

    if (chamada) {
      await set(ref(db, `historico-v2/${unidade.id}/${Date.now()}`), {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        nome: chamada.nome || "Visitante",
        motivo: chamada.motivo || "Não informado",
        statusFinal: chamada.status || "Sem status",
        finalizadoEm: new Date().toISOString(),
        finalizadoEmFormatado: new Date().toLocaleString("pt-BR"),
        tipoFinalizacao: "Manual pelo painel central",
      });
    }

    await remove(ref(db, `unidades-v2/${unidade.id}/chamada`));
    setAudioRespostaBlob(null);
    setUnidadeAberta(null);
  }

  function corStatus(unidade: Unidade) {
    if (unidade.chamada?.status === "Aguardando atendimento") {
      return "border-green-400 bg-green-500/10";
    }

    if (unidade.chamada?.status === "Em atendimento") {
      return "border-yellow-400 bg-yellow-500/10";
    }

    return "border-slate-700 bg-slate-900";
  }

  function bolinhaStatus(unidade: Unidade) {
    if (unidade.chamada?.status === "Aguardando atendimento") return "🟢";
    if (unidade.chamada?.status === "Em atendimento") return "🟡";
    return "⚪";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      <div className="w-full max-w-7xl mx-auto">
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-6 mb-6">
          <p className="text-green-400 font-bold text-sm mb-1">
            QR ACESSO • CENTRAL V2
          </p>

          <h1 className="text-3xl md:text-5xl font-black">
            🏢 Painel Central do Condomínio
          </h1>

          <p className="text-slate-400 mt-2">
            Visualize todas as unidades, chamadas, entregas e atendimentos em um
            só lugar.
          </p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black">{unidades.length}</p>
            <p className="text-xs text-slate-400">Unidades</p>
          </div>

          <div className="bg-slate-900 border border-green-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-green-400">
              {totalChamando}
            </p>
            <p className="text-xs text-slate-400">Chamando</p>
          </div>

          <div className="bg-slate-900 border border-yellow-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-yellow-400">
              {totalAtendimento}
            </p>
            <p className="text-xs text-slate-400">Em atendimento</p>
          </div>

          <div className="bg-slate-900 border border-blue-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-400">{totalLivres}</p>
            <p className="text-xs text-slate-400">Livres</p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["todos", "chamando", "atendimento", "livres"].map((item) => (
              <button
                key={item}
                onClick={() => setFiltro(item)}
                className={`py-3 rounded-xl font-bold ${
                  filtro === item ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                {item === "todos"
                  ? "Todos"
                  : item === "chamando"
                  ? "Chamando"
                  : item === "atendimento"
                  ? "Atendimento"
                  : "Livres"}
              </button>
            ))}
          </div>
        </section>

        {carregando ? (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 text-center text-slate-400">
            Carregando unidades...
          </div>
        ) : (
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {unidadesFiltradas.map((unidade) => (
              <button
                key={unidade.id}
                ref={(el) => {
                  cardRefs.current[unidade.id] = el;
                }}
                onClick={() => setUnidadeAberta(unidade)}
                className={`border-2 rounded-2xl p-3 text-left shadow-xl hover:scale-[1.02] transition relative ${
                  unidade.chamada?.status === "Aguardando atendimento"
                    ? "animate-pulse ring-4 ring-green-400 shadow-green-500/50"
                    : ""
                } ${corStatus(unidade)}`}
              >
               {unidade.chamada?.status === "Aguardando atendimento" && (() => {
  const prioridade = prioridadeChamada(unidade);

  const cor =
    prioridade === 1
      ? "bg-red-500"
      : prioridade === 2
      ? "bg-orange-500"
      : "bg-green-500";

  const texto =
    prioridade === 1
      ? `🚨 PRIORIDADE #${prioridade}`
      : `🔔 CHAMADO #${prioridade}`;

  return (
    <div
      className={`mb-2 ${cor} text-black text-[10px] font-black px-2 py-1 rounded-lg text-center animate-pulse`}
    >
      {texto}
    </div>
  );
})()}

                <div className="flex justify-between items-center mb-2">
                  <span>🏠</span>
                  <span>{bolinhaStatus(unidade)}</span>
                </div>

                <h2 className="font-black text-sm md:text-base">
                  {unidade.nome}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  {unidade.tipo || "Unidade"}
                </p>
              </button>
            ))}
          </section>
        )}
      </div>
{mostrarPopupAudio && (
  <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6">
    <div className="bg-cyan-700 border-2 border-cyan-300 rounded-3xl max-w-lg w-full p-8 text-center">

      <div className="text-5xl mb-3">
        🎤
      </div>

      <h2 className="text-4xl font-black mb-5">
        NOVO ÁUDIO
      </h2>

      <div className="bg-cyan-600 rounded-2xl p-4 mb-6">

        <p className="font-black text-xl mb-3">
          Novo áudio enviado pelo visitante
        </p>

        {(() => {
          const ultimo = [...mensagensUnidadeAberta]
            .reverse()
            .find(
              (m) =>
                m.autor === "visitante" &&
                m.tipo === "audio"
            );

          if (!ultimo?.audioBase64) return null;

          return (
            <audio
              controls
              className="w-full"
              src={ultimo.audioBase64}
            />
          );
        })()}
      </div>

      <button
        onClick={() => setMostrarPopupAudio(false)}
        className="w-full bg-white text-black py-4 rounded-2xl text-2xl font-black"
      >
        ENTENDI
      </button>

    </div>
  </div>
)}
      {unidadeAberta && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black">🏠 {unidadeAberta.nome}</h2>
                <p className="text-slate-400">
                  {unidadeAberta.tipo || "Unidade"}
                </p>
              </div>

              <button
                onClick={() => {
                  setAudioRespostaBlob(null);
                  setUnidadeAberta(null);
                }}
                className="bg-red-600 px-4 py-2 rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>

            {unidadeAberta.chamada && (
              <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 mb-4">
                <p className="text-green-400 font-black text-xl">
                  {unidadeAberta.chamada.nome || "Visitante"}
                </p>

                <p className="text-slate-300 mt-1">
                  Motivo: {unidadeAberta.chamada.motivo || "Não informado"}
                </p>

                <p className="text-yellow-400 mt-1">
                  Status: {unidadeAberta.chamada.status || "Sem status"}
                </p>

                <div className="mt-4 bg-slate-800 rounded-2xl p-4">
                  <p className="text-sm text-blue-300 font-black mb-3">
                    💬 Conversa do atendimento
                  </p>

                  {mensagensUnidadeAberta.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Ainda não há mensagens na conversa.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {mensagensUnidadeAberta.map((item) => (
                        <div
                          key={item.id}
                          className={
                            item.autor === "morador"
                              ? "bg-green-600/30 border border-green-500 rounded-2xl p-3"
                              : "bg-blue-600/30 border border-blue-500 rounded-2xl p-3"
                          }
                        >
                          <p className="text-xs font-black mb-2">
                            {item.autor === "morador" ? "Morador" : "Visitante"}
                          </p>

                          {item.tipo === "texto" && (
                            <p className="text-white font-bold">{item.texto}</p>
                          )}

                          {item.tipo === "audio" && item.audioBase64 && (
                            <audio controls className="w-full" src={item.audioBase64} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {unidadeAberta.chamada ? (
              <div className="space-y-3">
                <button
                  onClick={() => atenderChamada(unidadeAberta)}
                  className="w-full bg-green-500 py-4 rounded-xl font-black text-black"
                >
                  ✅ Atender
                </button>

                <button
                  onClick={() =>
                    enviarMensagem(
                      unidadeAberta,
                      "Aguarde um momento, por favor."
                    )
                  }
                  className="w-full bg-blue-600 py-4 rounded-xl font-bold"
                >
                  💬 Aguarde um momento
                </button>

                <div className="bg-slate-950 border border-blue-500/40 rounded-2xl p-4 space-y-3">
                  <button
                    onClick={
                      gravandoAudioMorador
                        ? pararGravacaoMorador
                        : iniciarGravacaoMorador
                    }
                    disabled={enviandoAudioMorador}
                    className={
                      gravandoAudioMorador
                        ? "w-full bg-red-600 py-4 rounded-xl font-black animate-pulse"
                        : "w-full bg-blue-600 py-4 rounded-xl font-black disabled:bg-slate-700"
                    }
                  >
                    {gravandoAudioMorador
                      ? "⏹️ Parar gravação"
                      : "🎙️ Gravar áudio para visitante"}
                  </button>

                  {audioRespostaBlob && (
                    <div className="space-y-3">
                      <audio
                        controls
                        className="w-full"
                        src={URL.createObjectURL(audioRespostaBlob)}
                      />

                      <button
                        onClick={() => enviarAudioMorador(unidadeAberta)}
                        disabled={enviandoAudioMorador}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 py-4 rounded-xl font-black"
                      >
                        {enviandoAudioMorador
                          ? "Enviando..."
                          : "📤 Enviar áudio ao visitante"}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => finalizarChamada(unidadeAberta)}
                  className="w-full bg-red-600 py-4 rounded-xl font-black"
                >
                  ❌ Finalizar
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                <button
                  onClick={() => criarChamadaTeste(unidadeAberta, "Visitante")}
                  className="w-full bg-slate-700 py-4 rounded-xl font-bold"
                >
                  Criar teste: Visitante
                </button>

                <button
                  onClick={() => criarChamadaTeste(unidadeAberta, "Entrega")}
                  className="w-full bg-blue-700 py-4 rounded-xl font-bold"
                >
                  Criar teste: Entrega
                </button>

                <button
                  onClick={() =>
                    criarChamadaTeste(unidadeAberta, "Entrega de comida")
                  }
                  className="w-full bg-orange-600 py-4 rounded-xl font-bold"
                >
                  Criar teste: 🍔 Comida
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}