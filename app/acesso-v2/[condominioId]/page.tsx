"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../services/firebase";

import { useUnidades } from "../../components/acesso-v2/hooks/useUnidades";
import { useGravadorAudio } from "../../components/acesso-v2/hooks/useGravadorAudio";

import NotificacaoPopup from "../../components/acesso-v2/components/NotificacaoPopup";
import Conversa from "../../components/acesso-v2/components/Conversa";
import GravadorAudio from "../../components/acesso-v2/components/GravadorAudio";

import {
  registrarMensagemConversa,
  cancelarChamadaNoFirebase,
  criarChamadaNoFirebase,
  enviarPushChamada,
} from "../../components/acesso-v2/services/chamadaService";

import {
  TEMPO_AGUARDANDO_MS,
  TEMPO_EM_ATENDIMENTO_MS,
  chamadaEstaAtiva,
  textoStatusChamada,
  pegarTempoBase,
  ordenarMensagens,
} from "../../components/acesso-v2/utils/chamadaUtils";

import { blobParaBase64 } from "../../components/acesso-v2/utils/audioUtils";

export default function AcessoV2Condominio() {
  const params = useParams();
  const condominioId = String(params.condominioId || "condominio-teste");

  const {
    carregando,
    busca,
    setBusca,
    blocoSelecionado,
    setBlocoSelecionado,
    unidadeSelecionada,
    setUnidadeSelecionada,
    blocos,
    temBlocos,
    unidadesFiltradas,
    unidadeAtualSelecionada,
    voltarBlocoBase,
  } = useUnidades();

  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [outroMotivo, setOutroMotivo] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [popupTexto, setPopupTexto] = useState("");
  const [popupTipo, setPopupTipo] = useState<"mensagem" | "encerrado" | "audio">(
    "mensagem"
  );
  const [popupAudioBase64, setPopupAudioBase64] = useState("");

  const chamadaAtivaRef = useRef(false);
  const chamadaFoiEnviadaRef = useRef(false);
  const ultimoPopupRef = useRef("");
  const timerAutomaticoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoAudioPopupRef = useRef("");

  const {
    gravandoAudio,
    audioBlob,
    setAudioBlob,
    iniciarGravacao,
    pararGravacao,
  } = useGravadorAudio({
    podeGravar: !!(unidadeAtualSelecionada || unidadeSelecionada),
    aoIniciarGravacao: () => {
      setMensagem("");
    },
  });

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

      if (!chamadaFoiEnviadaRef.current) return;

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

  const chamadaSelecionadaAtiva = chamadaEstaAtiva(
    unidadeAtualSelecionada?.chamada
  );

  const mensagensConversa = useMemo(() => {
    return ordenarMensagens(unidadeAtualSelecionada?.chamada?.mensagens);
  }, [unidadeAtualSelecionada?.chamada?.mensagens]);

  useEffect(() => {
  if (!mensagensConversa || mensagensConversa.length === 0) return;

  const ultimoAudioMorador = [...mensagensConversa]
    .reverse()
    .find(
      (mensagem) =>
        mensagem.autor === "morador" &&
        mensagem.tipo === "audio" &&
        mensagem.audioBase64
    );

  if (!ultimoAudioMorador) return;

  const idAudio = `${ultimoAudioMorador.id || ""}-${ultimoAudioMorador.criadoEm || ""}`;

  if (idAudio === ultimoAudioPopupRef.current) return;

  ultimoAudioPopupRef.current = idAudio;

  setPopupTipo("audio");
  setPopupTexto("O responsável enviou uma mensagem de voz.");
  setPopupAudioBase64(ultimoAudioMorador.audioBase64 || "");
  }, [mensagensConversa]);

  const precisaNome = motivo === "Visitante";
  const precisaDescricao = motivo === "Outros";

  async function enviarAudioNaConversa(blob: Blob) {
    const unidadeAtual = unidadeAtualSelecionada || unidadeSelecionada;

    if (!unidadeAtual) {
      alert("Selecione uma unidade.");
      return;
    }

    if (!chamadaEstaAtiva(unidadeAtual.chamada)) {
      await chamarUnidade(blob);
      return;
    }

    try {
      setEnviando(true);

      const audioBase64 = await blobParaBase64(blob);

      await registrarMensagemConversa(unidadeAtual.id, {
        autor: "visitante",
        tipo: "audio",
        audioBase64,
      });

      setAudioBlob(null);
      setMensagem("✅ Áudio enviado na conversa.");
    } catch (erro) {
      console.error("Erro ao enviar áudio na conversa:", erro);
      alert("Erro ao enviar áudio. Tente novamente.");
    } finally {
      setEnviando(false);
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
      if (blobFinal) {
        await enviarAudioNaConversa(blobFinal);
        return;
      }

      setMensagem(
        "⚠️ Já existe uma chamada ativa para essa unidade. Você ainda pode gravar e enviar áudio na conversa."
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

    if (blobFinal) audioBase64 = await blobParaBase64(blobFinal);

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

      await criarChamadaNoFirebase(unidadeAtual.id, {
        nome: nomeFinal,
        motivo: motivoFinal,
        audioBase64,
        mensagens: audioBase64
          ? {
              [Date.now()]: {
                autor: "visitante",
                tipo: "audio",
                audioBase64,
                criadoEm: Date.now(),
              },
            }
          : null,
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

      const dadosPush = await enviarPushChamada(unidadeAtual.id);

      console.log("RESPOSTA PUSH V2:", dadosPush);

      setAudioBlob(null);

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

    if (chamadaSelecionadaAtiva) {
      await enviarAudioNaConversa(audioBlob);
      return;
    }

    await chamarUnidade(audioBlob);
  }

  async function cancelarChamada() {
    const unidadeAtual = unidadeAtualSelecionada || unidadeSelecionada;

    if (!unidadeAtual) return;

    try {
      await cancelarChamadaNoFirebase(unidadeAtual.id);
      setMensagem("");
      setPopupTexto("");
      setPopupAudioBase64("");
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
    setPopupAudioBase64("");
    setAudioBlob(null);
    ultimoPopupRef.current = "";
  }

  function voltarBloco() {
    voltarBlocoBase();
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setPopupTexto("");
    setPopupAudioBase64("");
    setAudioBlob(null);
    chamadaAtivaRef.current = false;
    chamadaFoiEnviadaRef.current = false;
    ultimoPopupRef.current = "";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 flex justify-center">
      <NotificacaoPopup
        popupTexto={popupTexto}
        popupTipo={popupTipo}
        audioBase64={popupAudioBase64}
        onFechar={async () => {
          
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
          setPopupAudioBase64("");
        }}
      />

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
                          setUnidadeSelecionada(unidade);
                        }}
                        disabled={false}
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

            {chamadaSelecionadaAtiva && (
              <Conversa mensagens={mensagensConversa} />
            )}

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
              disabled={
                enviando || !motivo || chamadaSelecionadaAtiva || gravandoAudio
              }
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-500 text-black text-xl font-black py-4 rounded-2xl"
            >
              {chamadaSelecionadaAtiva
                ? "⚠️ CHAMADA JÁ ATIVA"
                : enviando
                ? "Enviando..."
                : "🔔 CHAMAR"}
            </button>

            <GravadorAudio
              gravando={gravandoAudio}
              enviando={enviando}
              audioBlob={audioBlob}
              onGravar={iniciarGravacao}
              onParar={pararGravacao}
              onEnviar={enviarAudioEChamar}
            />

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