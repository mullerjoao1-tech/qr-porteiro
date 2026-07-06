"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../services/firebase";

type Chamada = {
  nome?: string;
  motivo?: string;
  status?: string;
  criadoEm?: string;
  atendidoEm?: string;
  mensagemRapida?: string;
  respostaRapida?: string;
  resposta?: string;
  mensagemMorador?: string;
  mensagemResponsavel?: string;
  enviadoEm?: number;
  ultimaAtividade?: number;
  audioBase64?: string;
};

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  chamada?: Chamada;
};

const TEMPO_AGUARDANDO_MS = 5 * 60 * 1000;
const TEMPO_EM_ATENDIMENTO_MS = 3 * 60 * 1000;

function chamadaEstaAtiva(chamada?: Chamada) {
  if (!chamada) return false;

  const status = chamada.status || "";

  return status === "Aguardando atendimento" || status === "Em atendimento";
}

function textoStatusChamada(chamada?: Chamada) {
  if (!chamada) return "Disponível";

  if (chamada.status === "Aguardando atendimento") {
    return "Chamando";
  }

  if (chamada.status === "Em atendimento") {
    return "Em atendimento";
  }

  return "Disponível";
}

function pegarTempoBase(chamada?: Chamada) {
  if (!chamada) return Date.now();

  if (chamada.ultimaAtividade) return chamada.ultimaAtividade;

  if (chamada.enviadoEm) return chamada.enviadoEm;

  if (chamada.atendidoEm) {
    const tempo = new Date(chamada.atendidoEm).getTime();
    if (!Number.isNaN(tempo)) return tempo;
  }

  if (chamada.criadoEm) {
    const tempo = new Date(chamada.criadoEm).getTime();
    if (!Number.isNaN(tempo)) return tempo;
  }

  return Date.now();
}

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

export default function AcessoV2Condominio() {
  const params = useParams();
  const condominioId = String(params.condominioId || "condominio-teste");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(
    null
  );

  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [outroMotivo, setOutroMotivo] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [popupTexto, setPopupTexto] = useState("");
  const [popupTipo, setPopupTipo] = useState<"mensagem" | "encerrado">(
    "mensagem"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chamarDepoisDoAudioRef = useRef(false);

  const chamadaAtivaRef = useRef(false);
  const chamadaFoiEnviadaRef = useRef(false);
  const ultimoPopupRef = useRef("");
  const timerAutomaticoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const referencia = ref(db, "unidades-v2");

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidades([]);
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

      setUnidadeSelecionada((unidadeAtual) => {
        if (!unidadeAtual) return null;

        const unidadeAtualizada = lista.find((u) => u.id === unidadeAtual.id);
        return unidadeAtualizada || unidadeAtual;
      });
    });

    return () => pararDeOuvir();
  }, []);

  useEffect(() => {
    if (!unidadeSelecionada) return;

    const referencia = ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`);

    const limparTimerAutomatico = () => {
      if (timerAutomaticoRef.current) {
        clearTimeout(timerAutomaticoRef.current);
        timerAutomaticoRef.current = null;
      }
    };

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const chamada = snapshot.val();

      limparTimerAutomatico();

      if (!chamada) {
        if (chamadaAtivaRef.current && chamadaFoiEnviadaRef.current) {
          setPopupTipo("encerrado");
          setPopupTexto("Atendimento encerrado pelo responsável.");
        }

        chamadaAtivaRef.current = false;
        chamadaFoiEnviadaRef.current = false;
        ultimoPopupRef.current = "";
        setMensagem("");
        return;
      }

      if (!chamadaFoiEnviadaRef.current) {
        return;
      }

      chamadaAtivaRef.current = true;

      if (chamada.status === "Aguardando atendimento") {
        const tempoBase = pegarTempoBase(chamada);
        const tempoRestante = Math.max(
          TEMPO_AGUARDANDO_MS - (Date.now() - tempoBase),
          1000
        );

        timerAutomaticoRef.current = setTimeout(async () => {
          await update(ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`), {
            status: "Cancelado automaticamente",
            notificar: false,
            canceladoEm: Date.now(),
            motivoCancelamento: "Expirado sem atendimento",
          });

          await remove(ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`));
        }, tempoRestante);
      }

      if (chamada.status === "Em atendimento") {
        const tempoBase = pegarTempoBase(chamada);
        const tempoRestante = Math.max(
          TEMPO_EM_ATENDIMENTO_MS - (Date.now() - tempoBase),
          1000
        );

        timerAutomaticoRef.current = setTimeout(async () => {
          await update(ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`), {
            status: "Finalizado automaticamente",
            notificar: false,
            finalizadoEm: Date.now(),
            motivoFinalizacao: "Finalização automática por tempo",
          });

          await remove(ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`));
        }, tempoRestante);
      }

      const textoResposta =
        chamada.mensagemRapida ||
        chamada.respostaRapida ||
        chamada.mensagemResponsavel ||
        chamada.resposta ||
        chamada.mensagemMorador ||
        "";

      const idMensagem = `${textoResposta}-${chamada.enviadoEm || ""}`;

      if (textoResposta && idMensagem !== ultimoPopupRef.current) {
        ultimoPopupRef.current = idMensagem;
        setPopupTipo("mensagem");
        setPopupTexto(textoResposta);
      }
    });

    return () => {
      limparTimerAutomatico();
      pararDeOuvir();
    };
  }, [unidadeSelecionada]);

  const blocos = useMemo(() => {
    const lista = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, index, array) => array.indexOf(valor) === index);

    return lista.sort();
  }, [unidades]);

  const temBlocos = blocos.length > 1 || blocos[0] !== "Único";

  const unidadesDoBloco = useMemo(() => {
    if (!temBlocos) return unidades;

    return unidades.filter(
      (unidade) => (unidade.bloco || "Único") === blocoSelecionado
    );
  }, [unidades, blocoSelecionado, temBlocos]);

  const unidadesFiltradas = useMemo(() => {
    const texto = busca.toLowerCase().trim();

    if (!texto) return unidadesDoBloco;

    return unidadesDoBloco.filter((unidade) =>
      `${unidade.nome} ${unidade.tipo || ""} ${unidade.id}`
        .toLowerCase()
        .includes(texto)
    );
  }, [busca, unidadesDoBloco]);

  const unidadeAtualSelecionada = useMemo(() => {
    if (!unidadeSelecionada) return null;

    return (
      unidades.find((unidade) => unidade.id === unidadeSelecionada.id) ||
      unidadeSelecionada
    );
  }, [unidades, unidadeSelecionada]);

  const chamadaSelecionadaAtiva = chamadaEstaAtiva(
    unidadeAtualSelecionada?.chamada
  );

  const precisaNome = motivo === "Visitante";
  const precisaDescricao = motivo === "Outros";

  async function iniciarGravacao() {
    if (!unidadeAtualSelecionada && !unidadeSelecionada) {
      alert("Selecione uma unidade antes de gravar.");
      return;
    }

    if (chamadaSelecionadaAtiva) {
      setMensagem(
        "⚠️ Já existe uma chamada ativa para essa unidade. Aguarde o atendimento ou cancele a chamada anterior."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      chamarDepoisDoAudioRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);
        setGravandoAudio(false);

        stream.getTracks().forEach((track) => track.stop());

        if (chamarDepoisDoAudioRef.current) {
          chamarDepoisDoAudioRef.current = false;

          setTimeout(() => {
            chamarUnidade(blob);
          }, 300);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      setAudioBlob(null);
      setMensagem("");
      setGravandoAudio(true);

      setTimeout(() => {
        if (recorder.state === "recording") {
          pararGravacao();
        }
      }, 15000);
    } catch (erro) {
      alert("Não foi possível acessar o microfone.");
      console.error(erro);
      setGravandoAudio(false);
    }
  }

  function pararGravacao() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      chamarDepoisDoAudioRef.current = false;
      mediaRecorderRef.current.stop();
    } else {
      setGravandoAudio(false);
    }
  }

  async function chamarUnidade(audioParaEnviar?: Blob) {
    const unidadeAtual = unidadeAtualSelecionada || unidadeSelecionada;
    const blobFinal = audioParaEnviar || audioBlob;

    if (!unidadeAtual) {
      alert("Selecione uma unidade.");
      return;
    }

    if (chamadaEstaAtiva(unidadeAtual.chamada)) {
      setMensagem(
        "⚠️ Já existe uma chamada ativa para essa unidade. Aguarde o atendimento ou cancele a chamada anterior."
      );
      return;
    }

    if (!motivo && !blobFinal) {
      alert("Escolha o motivo da chamada ou grave um áudio.");
      return;
    }

    if (precisaNome && !nome.trim()) {
      alert("Digite seu nome.");
      return;
    }

    if (precisaDescricao && !outroMotivo.trim()) {
      alert("Descreva o motivo.");
      return;
    }

    const motivoFinal = motivo
      ? motivo === "Outros"
        ? outroMotivo.trim()
        : motivo
      : "Áudio do visitante";

    let audioBase64 = null;

    if (blobFinal) {
      audioBase64 = await blobParaBase64(blobFinal);
    }

    let nomeFinal = nome.trim();

    if (!motivo && blobFinal) nomeFinal = "Áudio do visitante";
    if (motivo === "Entrega") nomeFinal = "Entrega";
    if (motivo === "Entrega de comida") nomeFinal = "Entrega de comida";
    if (motivo === "Outros" && !nomeFinal) nomeFinal = "Outro chamado";

    try {
      setEnviando(true);
      setMensagem("");
      setPopupTexto("");
      ultimoPopupRef.current = "";
      chamadaFoiEnviadaRef.current = true;
      chamadaAtivaRef.current = true;

      await update(ref(db, `unidades-v2/${unidadeAtual.id}/chamada`), {
        nome: nomeFinal,
        motivo: motivoFinal,
        audioBase64,
        status: "Aguardando atendimento",
        criadoEm: new Date().toISOString(),
        ultimaAtividade: Date.now(),
        notificar: true,
        condominioId,
        origem: "acesso-v2",

        mensagemRapida: null,
        respostaRapida: null,
        mensagemResponsavel: null,
        resposta: null,
        mensagemMorador: null,
        enviadoEm: null,
        visualizadoPeloVisitante: false,
      });

      const respostaPush = await fetch("/api/enviar-notificacao-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidadeId: unidadeAtual.id,
        }),
      });

      const dadosPush = await respostaPush.json();
      console.log("RESPOSTA PUSH V2:", dadosPush);

      setMensagem(
        audioBase64
          ? `✅ Áudio enviado e chamada feita para ${unidadeAtual.nome}. Aguarde o atendimento.`
          : `✅ Chamada enviada para ${unidadeAtual.nome}. Aguarde o atendimento.`
      );
    } catch (erro) {
      console.error("Erro ao chamar unidade:", erro);
      alert("Erro ao enviar chamada. Tente novamente.");
      chamadaAtivaRef.current = false;
      chamadaFoiEnviadaRef.current = false;
    } finally {
      setEnviando(false);
    }
  }

  async function enviarAudioEChamar() {
    if (!audioBlob) {
      alert("Grave um áudio antes de enviar.");
      return;
    }

    await chamarUnidade(audioBlob);
  }

  async function cancelarChamada() {
    const unidadeAtual = unidadeAtualSelecionada || unidadeSelecionada;

    if (!unidadeAtual) return;

    try {
      await update(ref(db, `unidades-v2/${unidadeAtual.id}/chamada`), {
        status: "Cancelado pelo visitante",
        notificar: false,
        canceladoEm: Date.now(),
      });

      await remove(ref(db, `unidades-v2/${unidadeAtual.id}/chamada`));

      setMensagem("");
      setPopupTexto("");
      setUnidadeSelecionada(null);
      setNome("");
      setMotivo("");
      setOutroMotivo("");
      setAudioBlob(null);

      chamadaAtivaRef.current = false;
      chamadaFoiEnviadaRef.current = false;
      ultimoPopupRef.current = "";
    } catch (erro) {
      console.error("Erro ao cancelar:", erro);
    }
  }

  function limparSelecao() {
    setUnidadeSelecionada(null);
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setPopupTexto("");
    setAudioBlob(null);
    ultimoPopupRef.current = "";
  }

  function voltarBloco() {
    setBlocoSelecionado("");
    setBusca("");
    setUnidadeSelecionada(null);
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setPopupTexto("");
    setAudioBlob(null);
    chamadaAtivaRef.current = false;
    chamadaFoiEnviadaRef.current = false;
    ultimoPopupRef.current = "";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 flex justify-center">
      {popupTexto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5">
          <div
            className={
              popupTipo === "encerrado"
                ? "w-full max-w-xl bg-green-600 border-4 border-green-300 rounded-3xl p-8 text-center shadow-2xl"
                : "w-full max-w-xl bg-blue-600 border-4 border-blue-300 rounded-3xl p-8 text-center shadow-2xl"
            }
          >
            <p className="text-5xl mb-4">
              {popupTipo === "encerrado" ? "✅" : "💬"}
            </p>

            <h2 className="text-2xl font-black mb-3">
              {popupTipo === "encerrado"
                ? "ATENDIMENTO ENCERRADO"
                : "NOVA MENSAGEM"}
            </h2>

            <p className="text-3xl font-black leading-relaxed py-6">
              {popupTexto}
            </p>

            <button
              onClick={async () => {
                if (unidadeAtualSelecionada) {
                  await update(
                    ref(db, `unidades-v2/${unidadeAtualSelecionada.id}/chamada`),
                    {
                      visualizadoPeloVisitante: true,
                      ultimaAtividade: Date.now(),
                    }
                  );
                }

                setPopupTexto("");
              }}
              className="mt-7 w-full bg-white text-black text-2xl font-black py-5 rounded-2xl"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl">
        <section className="bg-slate-900 border border-slate-700 rounded-3xl p-6 mb-5 text-center">
          <p className="text-green-400 font-black text-sm mb-2">
            QR ACESSO • V2
          </p>

          <h1 className="text-3xl font-black">🏢 Chamar Unidade</h1>

          <p className="text-slate-400 mt-2">
            Escolha bloco, unidade e motivo da chamada.
          </p>
        </section>

        {carregando && (
          <section className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
            <p className="text-slate-400">Carregando unidades...</p>
          </section>
        )}

        {!carregando && temBlocos && !blocoSelecionado && (
          <section className="bg-slate-900 border border-slate-700 rounded-3xl p-5">
            <h2 className="text-2xl font-black mb-4">Escolha o bloco</h2>

            <div className="grid grid-cols-1 gap-3">
              {blocos.map((bloco) => (
                <button
                  key={bloco}
                  onClick={() => setBlocoSelecionado(bloco)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl p-5 text-left"
                >
                  <p className="text-2xl font-black">🏢 {bloco}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {!carregando &&
          (!temBlocos || blocoSelecionado) &&
          !unidadeSelecionada && (
            <section className="bg-slate-900 border border-slate-700 rounded-3xl p-5">
              {temBlocos && (
                <button
                  onClick={voltarBloco}
                  className="mb-4 text-sm text-slate-300 underline"
                >
                  ← Trocar bloco
                </button>
              )}

              <h2 className="text-2xl font-black mb-4">Escolha a unidade</h2>

              <label className="text-sm text-slate-300 font-bold">
                Buscar unidade
              </label>

              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Ex: 101, casa 5, apto 202"
                className="w-full mt-2 mb-5 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-4 text-white outline-none focus:border-green-400"
              />

              {unidadesFiltradas.length > 0 ? (
                <div className="space-y-3">
                  {unidadesFiltradas.map((unidade) => {
                    const ocupada = chamadaEstaAtiva(unidade.chamada);
                    const statusTexto = textoStatusChamada(unidade.chamada);

                    return (
                      <button
                        key={unidade.id}
                        onClick={() => {
                          if (ocupada) return;
                          setUnidadeSelecionada(unidade);
                        }}
                        disabled={ocupada}
                        className={
                          ocupada
                            ? "w-full bg-slate-900 border border-yellow-500/40 rounded-2xl p-4 text-left opacity-70"
                            : "w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl p-4 text-left"
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xl font-black">
                              🏠 {unidade.nome}
                            </p>
                            <p className="text-sm text-slate-400">
                              {unidade.tipo || "Unidade"}
                            </p>
                          </div>

                          <span
                            className={
                              ocupada
                                ? "text-yellow-400 text-sm font-bold"
                                : "text-green-400 text-sm font-bold"
                            }
                          >
                            {statusTexto}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-red-400 text-center py-8">
                  Nenhuma unidade encontrada.
                </p>
              )}
            </section>
          )}

        {unidadeSelecionada && (
          <section
            className={
              chamadaSelecionadaAtiva
                ? "bg-slate-900 border border-yellow-500 rounded-3xl p-5"
                : "bg-slate-900 border border-green-500 rounded-3xl p-5"
            }
          >
            <button
              onClick={limparSelecao}
              className="mb-4 text-sm text-slate-300 underline"
            >
              ← Trocar unidade
            </button>

            <div className="bg-slate-800 rounded-2xl p-4 mb-5">
              <p className="text-sm text-slate-400">Unidade selecionada</p>
              <h2 className="text-2xl font-black text-green-400">
                🏠 {unidadeAtualSelecionada?.nome || unidadeSelecionada.nome}
              </h2>
              <p className="text-slate-400">
                {unidadeAtualSelecionada?.tipo ||
                  unidadeSelecionada.tipo ||
                  "Unidade"}
              </p>

              {chamadaSelecionadaAtiva && (
                <div className="mt-4 bg-yellow-500/15 border border-yellow-500 rounded-2xl p-3 text-yellow-300 font-bold text-center">
                  ⚠️ Já existe uma chamada ativa para esta unidade.
                </div>
              )}
            </div>

            <p className="text-sm text-slate-300 font-bold mb-3">
              O que você precisa?
            </p>

            <div className="grid grid-cols-1 gap-3 mb-5">
              {["Visitante", "Entrega", "Entrega de comida", "Outros"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMotivo(item);
                      setMensagem("");
                    }}
                    disabled={chamadaSelecionadaAtiva || gravandoAudio}
                    className={
                      motivo === item
                        ? "bg-green-500 text-black font-black py-4 rounded-2xl disabled:bg-gray-500"
                        : "bg-slate-800 text-white font-bold py-4 rounded-2xl border border-slate-600 disabled:opacity-50"
                    }
                  >
                    {item === "Visitante" && "👤 Visitante"}
                    {item === "Entrega" && "📦 Entrega / encomenda"}
                    {item === "Entrega de comida" && "🍔 Entrega de comida"}
                    {item === "Outros" && "✍️ Outros"}
                  </button>
                )
              )}
            </div>

            {motivo === "Visitante" && (
              <>
                <label className="text-sm text-slate-300 font-bold">
                  Seu nome
                </label>
                <input
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  disabled={chamadaSelecionadaAtiva || gravandoAudio}
                  placeholder="Digite seu nome"
                  className="w-full mt-2 mb-5 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-4 text-white outline-none focus:border-green-400 disabled:opacity-50"
                />
              </>
            )}

            {motivo === "Outros" && (
              <>
                <label className="text-sm text-slate-300 font-bold">
                  Descreva o motivo
                </label>
                <input
                  value={outroMotivo}
                  onChange={(evento) => setOutroMotivo(evento.target.value)}
                  disabled={chamadaSelecionadaAtiva || gravandoAudio}
                  placeholder="Ex: reunião, manutenção, serviço..."
                  className="w-full mt-2 mb-5 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-4 text-white outline-none focus:border-green-400 disabled:opacity-50"
                />
              </>
            )}

            {(motivo === "Entrega" || motivo === "Entrega de comida") &&
              !chamadaSelecionadaAtiva && (
                <div className="mb-5 bg-blue-500/10 border border-blue-500/40 rounded-2xl p-4 text-blue-300 text-sm font-bold text-center">
                  Para esse tipo de chamada, não precisa informar nome.
                </div>
              )}

            <button
              onClick={() => chamarUnidade()}
              disabled={enviando || !motivo || chamadaSelecionadaAtiva || gravandoAudio}
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-500 text-black text-xl font-black py-4 rounded-2xl"
            >
              {chamadaSelecionadaAtiva
                ? "⚠️ CHAMADA JÁ ATIVA"
                : enviando
                ? "Enviando..."
                : "🔔 CHAMAR"}
            </button>

            <div className="mt-4 space-y-3">
              <button
                onClick={gravandoAudio ? pararGravacao : iniciarGravacao}
                disabled={enviando || chamadaSelecionadaAtiva}
                className={
                  gravandoAudio
                    ? "w-full bg-red-600 text-white text-xl font-black py-4 rounded-2xl animate-pulse"
                    : "w-full bg-blue-600 text-white text-xl font-black py-4 rounded-2xl disabled:bg-gray-500"
                }
              >
                {gravandoAudio
                  ? "⏹️ PARAR GRAVAÇÃO"
                  : "🎙️ GRAVAR ÁUDIO"}
              </button>

              {audioBlob && (
                <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 space-y-3">
                  <p className="text-blue-300 text-sm font-bold text-center">
                    Áudio gravado. Agora envie para chamar o morador.
                  </p>

                  <audio
                    controls
                    className="w-full"
                    src={URL.createObjectURL(audioBlob)}
                  />

                  <button
                    onClick={enviarAudioEChamar}
                    disabled={enviando || chamadaSelecionadaAtiva}
                    className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-500 text-white text-xl font-black py-4 rounded-2xl"
                  >
                    {enviando ? "Enviando..." : "📤 ENVIAR ÁUDIO E CHAMAR"}
                  </button>
                </div>
              )}
            </div>

            {mensagem && (
              <div className="mt-5 space-y-4">
                <div
                  className={
                    mensagem.startsWith("⚠️")
                      ? "bg-yellow-500/15 border border-yellow-500 rounded-2xl p-4 text-yellow-300 font-bold text-center"
                      : "bg-green-500/15 border border-green-500 rounded-2xl p-4 text-green-300 font-bold text-center"
                  }
                >
                  {mensagem}
                </div>

                {chamadaAtivaRef.current && (
                  <button
                    onClick={cancelarChamada}
                    className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                  >
                    ❌ CANCELAR CHAMADA
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
