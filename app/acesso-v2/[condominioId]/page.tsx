"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../services/firebase";

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  chamada?: {
    nome?: string;
    motivo?: string;
    status?: string;
    criadoEm?: string;
    mensagemRapida?: string;
    respostaRapida?: string;
    resposta?: string;
    mensagemMorador?: string;
    mensagemResponsavel?: string;
    enviadoEm?: number;
  };
};

export default function AcessoV2Condominio() {
  const params = useParams();
  const condominioId = String(params.condominioId || "condominio-teste");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(null);

  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [outroMotivo, setOutroMotivo] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [popupTexto, setPopupTexto] = useState("");
  const [popupTipo, setPopupTipo] = useState<"mensagem" | "encerrado">("mensagem");

  const chamadaAtivaRef = useRef(false);
  const chamadaFoiEnviadaRef = useRef(false);
  const ultimoPopupRef = useRef("");

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
    });

    return () => pararDeOuvir();
  }, []);

  useEffect(() => {
    if (!unidadeSelecionada) return;

    const referencia = ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`);

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const chamada = snapshot.val();

      if (!chamada) {
        if (chamadaAtivaRef.current && chamadaFoiEnviadaRef.current) {
          setPopupTipo("encerrado");
          setPopupTexto("Atendimento encerrado pelo responsável.");
        }

        chamadaAtivaRef.current = false;
        chamadaFoiEnviadaRef.current = false;
        ultimoPopupRef.current = "";
        return;
      }

      if (!chamadaFoiEnviadaRef.current) {
        return;
      }

      chamadaAtivaRef.current = true;

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

    return () => pararDeOuvir();
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

  const precisaNome = motivo === "Visitante";
  const precisaDescricao = motivo === "Outros";

  
     async function chamarUnidade() {
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade.");
      return;
    }
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade.");
      return;
    }

    if (!motivo) {
      alert("Escolha o motivo da chamada.");
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

    const motivoFinal = motivo === "Outros" ? outroMotivo.trim() : motivo;

    let nomeFinal = nome.trim();

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

      await update(ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`), {
        nome: nomeFinal,
        motivo: motivoFinal,
        status: "Aguardando atendimento",
        criadoEm: new Date().toISOString(),
        notificar: true,
        condominioId,
        origem: "acesso-v2",

        mensagemRapida: null,
        respostaRapida: null,
        mensagemResponsavel: null,
        resposta: null,
        mensagemMorador: null,
        enviadoEm: null,
      });
const respostaPush = await fetch("/api/enviar-notificacao-v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    unidadeId: unidadeSelecionada.id,
  }),
});

const dadosPush = await respostaPush.json();
console.log("RESPOSTA PUSH V2:", dadosPush);
      setMensagem(`✅ Chamada enviada para ${unidadeSelecionada.nome}. Aguarde o atendimento.`);
    } catch (erro) {
      console.error("Erro ao chamar unidade:", erro);
      alert("Erro ao enviar chamada. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }
  async function cancelarChamada() {
  if (!unidadeSelecionada) return;

  try {
    await update(
      ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`),
      {
        status: "Cancelado pelo visitante",
        notificar: false,
        canceladoEm: Date.now(),
      }
    );

    await remove(ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`));

    setMensagem("");
    setPopupTexto("");
    setUnidadeSelecionada(null);
    setNome("");
    setMotivo("");
    setOutroMotivo("");

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
    chamadaAtivaRef.current = false;
    chamadaFoiEnviadaRef.current = false;
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
  if (unidadeSelecionada) {
    await update(
      ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`),
      {
        visualizadoPeloVisitante: true,
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
                    

const statusChamada = unidade.chamada?.status || "";
const temNome = unidade.chamada?.nome || "";
const temMotivo = unidade.chamada?.motivo || "";

const ocupada =
  !!unidade.chamada &&
  !!temNome &&
  !!temMotivo &&
  statusChamada !== "Encerrado" &&
  statusChamada !== "Finalizado" &&
  statusChamada !== "Cancelado pelo visitante" &&
  statusChamada !== "Cancelada pelo visitante" &&
  statusChamada !== "Atendimento encerrado";

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
                            {ocupada ? "Em atendimento" : "Disponível"}
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
          <section className="bg-slate-900 border border-green-500 rounded-3xl p-5">
            <button
              onClick={limparSelecao}
              className="mb-4 text-sm text-slate-300 underline"
            >
              ← Trocar unidade
            </button>

            <div className="bg-slate-800 rounded-2xl p-4 mb-5">
              <p className="text-sm text-slate-400">Unidade selecionada</p>
              <h2 className="text-2xl font-black text-green-400">
                🏠 {unidadeSelecionada.nome}
              </h2>
              <p className="text-slate-400">
                {unidadeSelecionada.tipo || "Unidade"}
              </p>
            </div>

            <p className="text-sm text-slate-300 font-bold mb-3">
              O que você precisa?
            </p>

            <div className="grid grid-cols-1 gap-3 mb-5">
              {["Visitante", "Entrega", "Entrega de comida", "Outros"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setMotivo(item);
                    setMensagem("");
                  }}
                  className={
                    motivo === item
                      ? "bg-green-500 text-black font-black py-4 rounded-2xl"
                      : "bg-slate-800 text-white font-bold py-4 rounded-2xl border border-slate-600"
                  }
                >
                  {item === "Visitante" && "👤 Visitante"}
                  {item === "Entrega" && "📦 Entrega / encomenda"}
                  {item === "Entrega de comida" && "🍔 Entrega de comida"}
                  {item === "Outros" && "✍️ Outros"}
                </button>
              ))}
            </div>

            {motivo === "Visitante" && (
              <>
                <label className="text-sm text-slate-300 font-bold">
                  Seu nome
                </label>
                <input
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full mt-2 mb-5 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-4 text-white outline-none focus:border-green-400"
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
                  placeholder="Ex: reunião, manutenção, serviço..."
                  className="w-full mt-2 mb-5 bg-slate-950 border border-slate-600 rounded-2xl px-4 py-4 text-white outline-none focus:border-green-400"
                />
              </>
            )}

            {(motivo === "Entrega" || motivo === "Entrega de comida") && (
              <div className="mb-5 bg-blue-500/10 border border-blue-500/40 rounded-2xl p-4 text-blue-300 text-sm font-bold text-center">
                Para esse tipo de chamada, não precisa informar nome.
              </div>
            )}

                       <button
              onClick={chamarUnidade}
              disabled={enviando || !motivo}
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-500 text-black text-xl font-black py-4 rounded-2xl"
            >
              {enviando ? "Enviando..." : "🔔 CHAMAR"}
            </button>

                        {mensagem && (
              <div className="mt-5 space-y-4">
                <div className="bg-green-500/15 border border-green-500 rounded-2xl p-4 text-green-300 font-bold text-center">
                  {mensagem}
                </div>

                <button
                  onClick={cancelarChamada}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  ❌ CANCELAR CHAMADA
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}