"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, set, update, remove } from "firebase/database";
import { db } from "../../services/firebase";

type MensagemConversa = {
  id?: string;
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
};

type Chamada = {
  nome?: string;
  motivo?: string;
  status?: string;
  criadoEm?: string;
  atendidoEm?: string;
  audioBase64?: string;
  mensagemResponsavel?: string;
  ultimaAtividade?: number;
  enviadoEm?: number;
  mensagens?: Record<string, MensagemConversa>;
};

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  chamada?: Chamada;
};

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

function chamadaEstaAtiva(chamada?: Chamada) {
  if (!chamada) return false;

  return (
    chamada.status === "Aguardando atendimento" ||
    chamada.status === "Em atendimento"
  );
}

export default function MoradorV2Page() {
  const params = useParams();
  const unidadeId = String(params.unidadeId || "");

  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [disponivel, setDisponivel] = useState(true);
  const [mostrarPopupChamada, setMostrarPopupChamada] = useState(false);

  const [gravandoAudioMorador, setGravandoAudioMorador] = useState(false);
  const [audioRespostaBlob, setAudioRespostaBlob] = useState<Blob | null>(null);
  const [enviandoAudioMorador, setEnviandoAudioMorador] = useState(false);

  const [mostrarPopupAudio, setMostrarPopupAudio] = useState(false);
  const [ultimoAudioRecebido, setUltimoAudioRecebido] = useState<string | null>(
    null
  );

  const mediaRecorderMoradorRef = useRef<MediaRecorder | null>(null);
  const audioChunksMoradorRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!unidadeId) return;

    const unidadeRef = ref(db, `unidades-v2/${unidadeId}`);

    const pararDeOuvir = onValue(unidadeRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidade(null);
        setCarregando(false);
        return;
      }

      setUnidade({
        id: unidadeId,
        ...dados,
      });

      setCarregando(false);

      if (dados.chamada?.status === "Aguardando atendimento") {
        setMostrarPopupChamada(true);
      }
    });

    return () => pararDeOuvir();
  }, [unidadeId]);

  const mensagensConversa = useMemo(() => {
    return ordenarMensagens(unidade?.chamada?.mensagens);
  }, [unidade?.chamada?.mensagens]);

  useEffect(() => {
    if (!mensagensConversa.length) return;

    const ultimo = [...mensagensConversa]
      .reverse()
      .find(
        (m) =>
          m.autor === "visitante" && m.tipo === "audio" && Boolean(m.audioBase64)
      );

    if (!ultimo?.id) return;

    if (ultimo.id !== ultimoAudioRecebido) {
      setUltimoAudioRecebido(ultimo.id);
      setMostrarPopupAudio(true);
    }
  }, [mensagensConversa, ultimoAudioRecebido]);

  async function registrarMensagemConversa(
    dados: Omit<MensagemConversa, "criadoEm">
  ) {
    if (!unidade) return;

    const idMensagem = String(Date.now());

    await set(ref(db, `unidades-v2/${unidade.id}/chamada/mensagens/${idMensagem}`), {
      ...dados,
      criadoEm: Date.now(),
    });

    await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
      ultimaAtividade: Date.now(),
      enviadoEm: Date.now(),
    });
  }

  async function atenderChamada() {
    if (!unidade?.chamada) return;

    await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
      status: "Em atendimento",
      atendidoEm: new Date().toISOString(),
      ultimaAtividade: Date.now(),
    });

    setMostrarPopupChamada(false);
  }

  async function enviarMensagemRapida(texto: string) {
    if (!unidade?.chamada) return;

    await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
      status: "Em atendimento",
      mensagemResponsavel: texto,
      atendidoEm: new Date().toISOString(),
      ultimaAtividade: Date.now(),
      enviadoEm: Date.now(),
      visualizadoPeloVisitante: false,
    });

    await registrarMensagemConversa({
      autor: "morador",
      tipo: "texto",
      texto,
    });
  }

  async function iniciarGravacaoMorador() {
    if (!unidade?.chamada) {
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

  async function enviarAudioMorador() {
    if (!unidade?.chamada) return;

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
        enviadoEm: Date.now(),
        visualizadoPeloVisitante: false,
      });

      await registrarMensagemConversa({
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

  async function finalizarChamada() {
    if (!unidade?.chamada) return;

    const chamada = unidade.chamada;

    await set(ref(db, `historico-v2/${unidade.id}/${Date.now()}`), {
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      nome: chamada.nome || "Visitante",
      motivo: chamada.motivo || "Não informado",
      statusFinal: chamada.status || "Sem status",
      finalizadoEm: new Date().toISOString(),
      finalizadoEmFormatado: new Date().toLocaleString("pt-BR"),
      tipoFinalizacao: "Manual pelo morador",
      mensagens: chamada.mensagens || null,
    });

    await remove(ref(db, `unidades-v2/${unidade.id}/chamada`));

    setAudioRespostaBlob(null);
    setMostrarPopupChamada(false);
    setMostrarPopupAudio(false);
  }

  const chamadaAtiva = chamadaEstaAtiva(unidade?.chamada);

  const ultimoAudioVisitante = [...mensagensConversa]
    .reverse()
    .find((m) => m.autor === "visitante" && m.tipo === "audio");

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
          <p className="text-slate-400">Carregando painel do morador...</p>
        </div>
      </main>
    );
  }

  if (!unidade) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-700 rounded-3xl p-8 text-center max-w-xl">
          <h1 className="text-3xl font-black text-red-400 mb-3">
            Unidade não encontrada
          </h1>
          <p className="text-slate-400">
            Verifique se o link do morador está correto.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      {mostrarPopupAudio && ultimoAudioVisitante?.audioBase64 && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6">
          <div className="bg-cyan-700 border-4 border-cyan-300 rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl">
            <div className="text-5xl mb-3">🎤</div>

            <h2 className="text-4xl font-black mb-5">NOVO ÁUDIO</h2>

            <div className="bg-cyan-600 rounded-2xl p-4 mb-6">
              <p className="font-black text-xl mb-3">
                Novo áudio enviado pelo visitante
              </p>

              <audio
                controls
                className="w-full"
                src={ultimoAudioVisitante.audioBase64}
              />
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

      {mostrarPopupChamada && unidade.chamada && (
        <div className="fixed inset-0 bg-black/80 z-[900] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-green-400 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-center">
            <p className="text-6xl mb-3">🔔</p>

            <h2 className="text-3xl font-black text-green-300">
              NOVA CHAMADA
            </h2>

            <p className="text-xl font-black mt-4">
              {unidade.chamada.nome || "Visitante"}
            </p>

            <p className="text-slate-300 mt-2">
              Motivo: {unidade.chamada.motivo || "Não informado"}
            </p>

            {ultimoAudioVisitante?.audioBase64 && (
              <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 mt-5">
                <p className="text-sm font-black text-blue-300 mb-3">
                  🎙️ Áudio do visitante
                </p>

                <audio
                  controls
                  className="w-full"
                  src={ultimoAudioVisitante.audioBase64}
                />
              </div>
            )}

            <div className="grid gap-3 mt-6">
              <button
                onClick={atenderChamada}
                className="w-full bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
              >
                ✅ ATENDER
              </button>

              <button
                onClick={() => {
                  setMostrarPopupChamada(false);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xl font-black py-4 rounded-2xl"
              >
                VER PAINEL
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto">
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-6 mb-5">
          <p className="text-green-400 font-black text-sm mb-2">
            QR ACESSO • MORADOR V2
          </p>

          <h1 className="text-3xl md:text-5xl font-black">
            🏠 {unidade.nome}
          </h1>

          <p className="text-slate-400 mt-2">
            Painel do morador para atendimento, mensagens e áudio.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={() => setDisponivel(!disponivel)}
              className={
                disponivel
                  ? "bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black"
                  : "bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black"
              }
            >
              {disponivel ? "🟢 Disponível" : "🔴 Ausente"}
            </button>

            <button
              onClick={() => alert("Som de teste será restaurado na próxima etapa.")}
              className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-black"
            >
              🔊 Testar som
            </button>
          </div>
        </section>

        <section
          className={
            chamadaAtiva
              ? "bg-slate-900 border border-yellow-500 rounded-3xl p-5"
              : "bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center"
          }
        >
          {!chamadaAtiva && (
            <>
              <p className="text-5xl mb-4">✅</p>
              <h2 className="text-2xl font-black text-green-300">
                Nenhuma chamada ativa
              </h2>
              <p className="text-slate-400 mt-2">
                Quando alguém chamar esta unidade, o atendimento aparecerá aqui.
              </p>
            </>
          )}

          {chamadaAtiva && unidade.chamada && (
            <>
              <div className="bg-slate-800 rounded-2xl p-4 mb-4">
                <p className="text-green-400 font-black text-2xl">
                  {unidade.chamada.nome || "Visitante"}
                </p>

                <p className="text-slate-300 mt-1">
                  Motivo: {unidade.chamada.motivo || "Não informado"}
                </p>

                <p className="text-yellow-400 mt-1">
                  Status: {unidade.chamada.status || "Sem status"}
                </p>
              </div>

              <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 mb-4">
                <p className="text-blue-300 font-black mb-3">
                  💬 Conversa do atendimento
                </p>

                {mensagensConversa.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    A conversa ainda não possui mensagens.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {mensagensConversa.map((item) => (
                      <div
                        key={item.id}
                        className={
                          item.autor === "morador"
                            ? "bg-green-600/30 border border-green-500 rounded-2xl p-3"
                            : "bg-blue-600/30 border border-blue-500 rounded-2xl p-3"
                        }
                      >
                        <p className="text-xs font-black mb-2">
                          {item.autor === "morador" ? "Você" : "Visitante"}
                        </p>

                        {item.tipo === "texto" && (
                          <p className="text-white font-bold">{item.texto}</p>
                        )}

                        {item.tipo === "audio" && item.audioBase64 && (
                          <audio
                            controls
                            className="w-full"
                            src={item.audioBase64}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {unidade.chamada.status === "Aguardando atendimento" && (
                  <button
                    onClick={atenderChamada}
                    className="w-full bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
                  >
                    ✅ ATENDER
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Aguarde um momento, por favor.",
                    "Já estou indo.",
                    "Pode deixar na portaria.",
                    "Não estou em casa no momento.",
                  ].map((texto) => (
                    <button
                      key={texto}
                      onClick={() => enviarMensagemRapida(texto)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl"
                    >
                      💬 {texto}
                    </button>
                  ))}
                </div>

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
                        onClick={enviarAudioMorador}
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
                  onClick={finalizarChamada}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  ❌ FINALIZAR ATENDIMENTO
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      alert("Abrir portão será restaurado na próxima etapa.")
                    }
                    className="bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-2xl"
                  >
                    🚪 Abrir portão
                  </button>

                  <button
                    onClick={() =>
                      alert("Câmera será restaurada na próxima etapa.")
                    }
                    className="bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl"
                  >
                    📷 Câmera
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
