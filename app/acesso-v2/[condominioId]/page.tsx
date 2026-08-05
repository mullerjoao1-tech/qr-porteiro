"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, update, remove, set, get } from "firebase/database";
import { db } from "../../services/firebase";

type MensagemConversa = {
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
};

type MensagemConversaComId = MensagemConversa & {
  id: string;
};

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  estruturaPaiId?: string;
  estruturaPaiNome?: string;
  condominioId?: string;
  localId?: string;
  localNome?: string;
  localSlug?: string;
  tipoLocal?: string;
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
    ultimaAtividade?: number;
    audioBase64?: string;
    mensagens?: Record<string, MensagemConversa>;
  };
};

type LocalCadastro = {
  id: string;
  nome: string;
  slug?: string;
  tipo?: string;
  tipoLocal?: string;
  segmento?: string;
  status?: string;
  configuracao?: {
    modoAtendimento?: string;
    [chave: string]: unknown;
  };
};

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function AcessoV2Condominio() {
  const params = useParams();
  const condominioId = String(params.condominioId || "condominio-teste");

  const [localCadastro, setLocalCadastro] = useState<LocalCadastro | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const tipoLocalNormalizado = (
    localCadastro?.tipo ||
    localCadastro?.tipoLocal ||
    localCadastro?.segmento ||
    ""
  )
    .trim()
    .toLowerCase();

  const localEhResidencia =
    tipoLocalNormalizado === "residencia" ||
    tipoLocalNormalizado === "residência" ||
    localCadastro?.configuracao?.modoAtendimento === "residencia";

  const [busca, setBusca] = useState("");
  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(null);
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [outroMotivo, setOutroMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const [popupTexto, setPopupTexto] = useState("");
  const [popupAudioBase64, setPopupAudioBase64] = useState("");
  const [popupTipo, setPopupTipo] = useState<"mensagem" | "audio" | "encerrado">("mensagem");
  const [popupAudioFoiOuvido, setPopupAudioFoiOuvido] = useState(false);
  const [mensagensConversa, setMensagensConversa] = useState<MensagemConversaComId[]>([]);

  const chamadaAtivaRef = useRef(false);
  const chamadaFoiEnviadaRef = useRef(false);
  const ultimoPopupRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function carregarLocal() {
      try {
        const referenciaDireta = ref(db, `locais-v2/${condominioId}`);
        const snapshotDireto = await get(referenciaDireta);

        if (snapshotDireto.exists()) {
          if (!cancelado) {
            setLocalCadastro({
              id: condominioId,
              ...snapshotDireto.val(),
            });
          }
          return;
        }

        const snapshotLocais = await get(ref(db, "locais-v2"));

        if (!snapshotLocais.exists()) {
          if (!cancelado) setLocalCadastro(null);
          return;
        }

        const locais = snapshotLocais.val() as Record<string, Partial<LocalCadastro>>;
        const encontrado = Object.entries(locais).find(
          ([id, local]) =>
            id === condominioId ||
            local.slug === condominioId ||
            local.id === condominioId
        );

        if (!cancelado) {
          setLocalCadastro(
            encontrado
              ? {
                  ...encontrado[1],
                  id: encontrado[1].id || encontrado[0],
                  nome: encontrado[1].nome || "QR Acesso",
                }
              : null
          );
        }
      } catch (erro) {
        console.error("Erro ao carregar o local no Cadastro Universal:", erro);
        if (!cancelado) setLocalCadastro(null);
      }
    }

    carregarLocal();

    const referencia = ref(db, "unidades-v2");
    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidades([]);
        setCarregando(false);
        return;
      }

      const todasAsUnidades = Object.entries(dados).map(([id, valor]: [string, any]) => {
        const blocoNormalizado =
          valor.bloco ||
          valor.estruturaPaiNome ||
          (valor.estruturaPaiId
            ? String(valor.estruturaPaiId)
                .replace(/^bloco-/i, "Bloco ")
                .replace(/-/g, " ")
            : "");

        return {
          id,
          ...valor,
          bloco: blocoNormalizado,
        };
      }) as Unidade[];

      const localIdAtual = localCadastro?.id || condominioId;

      const unidadesVinculadas = todasAsUnidades.filter(
        (unidade) =>
          unidade.localId === localIdAtual ||
          unidade.condominioId === localIdAtual ||
          unidade.localId === condominioId ||
          unidade.condominioId === condominioId
      );

      const unidadesSemVinculo = todasAsUnidades.filter(
        (unidade) => !unidade.localId && !unidade.condominioId
      );

      const lista = unidadesVinculadas.length > 0
        ? unidadesVinculadas
        : unidadesSemVinculo;

      lista.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
      );

      setUnidades(lista);
      setCarregando(false);
    });

    return () => {
      cancelado = true;
      pararDeOuvir();
    };
  }, [condominioId, localCadastro?.id]);

  useEffect(() => {
    if (
      localEhResidencia &&
      unidades.length === 1 &&
      !unidadeSelecionada
    ) {
      setUnidadeSelecionada(unidades[0]);
    }
  }, [localEhResidencia, unidadeSelecionada, unidades]);

  useEffect(() => {
    if (!unidadeSelecionada) {
      setMensagensConversa([]);
      return;
    }

    const referencia = ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`);

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const chamada = snapshot.val();

      if (!chamada) {
        setMensagensConversa([]);

        if (chamadaAtivaRef.current && chamadaFoiEnviadaRef.current) {
          setPopupTipo("encerrado");
          setPopupAudioBase64("");
          setPopupAudioFoiOuvido(false);
          setPopupTexto("Atendimento encerrado pelo responsável.");
          setUnidadeSelecionada(null);
          setNome("");
          setMotivo("");
          setOutroMotivo("");
          setMensagem("");
          setAudioBlob(null);
          setGravandoAudio(false);
          setEnviandoAudio(false);
          setBusca("");
          setBlocoSelecionado("");
        }

        chamadaAtivaRef.current = false;
        chamadaFoiEnviadaRef.current = false;
        ultimoPopupRef.current = "";
        return;
      }

      if (!chamadaFoiEnviadaRef.current) return;

      chamadaAtivaRef.current = true;

      const todasAsMensagens: MensagemConversaComId[] = chamada.mensagens
        ? (Object.entries(chamada.mensagens) as Array<[string, MensagemConversa]>)
            .map(([id, item]) => ({ id, ...item }))
            .sort(
              (mensagemA, mensagemB) =>
                Number(mensagemA.criadoEm || mensagemA.id) -
                Number(mensagemB.criadoEm || mensagemB.id)
            )
        : [];

      setMensagensConversa(todasAsMensagens);

      const mensagensMorador = todasAsMensagens.filter(
        (item) => item.autor === "morador"
      );

      const ultimaMensagemMorador =
        mensagensMorador.length > 0
          ? mensagensMorador[mensagensMorador.length - 1]
          : null;

      if (ultimaMensagemMorador) {
        const item = ultimaMensagemMorador;
        const idMensagem = `${item.id}-${item.criadoEm || ""}`;

        if (idMensagem !== ultimoPopupRef.current) {
          ultimoPopupRef.current = idMensagem;

          if (item.tipo === "audio" && item.audioBase64) {
            setPopupTipo("audio");
            setPopupTexto("Você recebeu um áudio do morador.");
            setPopupAudioBase64(item.audioBase64);
            setPopupAudioFoiOuvido(false);
            return;
          }

          if (item.tipo === "texto" && item.texto) {
            setPopupTipo("mensagem");
            setPopupAudioBase64("");
            setPopupAudioFoiOuvido(false);
            setPopupTexto(item.texto);
            return;
          }
        }
      }

      const textoResposta =
        chamada.mensagemRapida ||
        chamada.respostaRapida ||
        chamada.mensagemResponsavel ||
        chamada.resposta ||
        chamada.mensagemMorador ||
        "";

      const idMensagemAntiga = `${textoResposta}-${chamada.enviadoEm || ""}`;

      if (
        textoResposta &&
        idMensagemAntiga !== ultimoPopupRef.current &&
        textoResposta !== "ATENDIMENTO_ENCERRADO"
      ) {
        ultimoPopupRef.current = idMensagemAntiga;
        setPopupTipo("mensagem");
        setPopupAudioBase64("");
        setPopupAudioFoiOuvido(false);
        setPopupTexto(textoResposta);
      }
    });

    return () => pararDeOuvir();
  }, [unidadeSelecionada]);

  const blocos = useMemo(() => {
    const lista = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, index, array) => array.indexOf(valor) === index);

    return lista.sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true })
    );
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

    const unidadeIdAtual = unidadeSelecionada.id;
    const unidadeNomeAtual = unidadeSelecionada.nome;

    try {
      setDiagnostico("");
      setMensagem("");
      setEnviando(true);
      setPopupTexto("");
      setPopupAudioBase64("");
      setPopupAudioFoiOuvido(false);
      setMensagensConversa([]);

      ultimoPopupRef.current = "";
      chamadaFoiEnviadaRef.current = true;
      chamadaAtivaRef.current = true;
      setDiagnostico("Gravando chamada...");

      await update(
        ref(db, `unidades-v2/${unidadeIdAtual}/chamada`),
        {
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
        }
      );

      setEnviando(false);
      setDiagnostico("✅ Chamada enviada.");
      setMensagem(
        `✅ Chamada enviada para ${unidadeNomeAtual}. Aguarde o atendimento.`
      );

      fetch("/api/enviar-notificacao-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidadeId: unidadeIdAtual,
        }),
      })
        .then(async (respostaPush) => {
          const textoResposta = await respostaPush.text();
          let dadosPush: unknown = null;

          try {
            dadosPush = textoResposta ? JSON.parse(textoResposta) : null;
          } catch {
            dadosPush = textoResposta;
          }

          console.log("RESPOSTA PUSH V2:", dadosPush);

          if (!respostaPush.ok) {
            console.warn(
              "A chamada foi gravada, mas o push não foi confirmado:",
              dadosPush
            );
          }
        })
        .catch((erroPush) => {
          console.warn(
            "A chamada foi gravada, mas ocorreu falha no push:",
            erroPush
          );
        });
    } catch (erro: unknown) {
      console.error("Falha ao gravar a chamada:", erro);

      const detalhe =
        erro instanceof Error
          ? erro.message
          : String(erro) || "Erro desconhecido";

      setDiagnostico(`❌ ERRO: ${detalhe}`);
      setMensagem("");
      chamadaAtivaRef.current = false;
      chamadaFoiEnviadaRef.current = false;
      setEnviando(false);
    }
  }

  async function iniciarGravacao() {
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade antes de gravar.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) {
          audioChunksRef.current.push(evento.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);
        setGravandoAudio(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setAudioBlob(null);
      setGravandoAudio(true);

      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 15000);
    } catch (erro) {
      console.error("Erro ao acessar o microfone:", erro);
      alert("Não foi possível acessar o microfone.");
      setGravandoAudio(false);
    }
  }

  function pararGravacao() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      return;
    }

    setGravandoAudio(false);
  }

  async function enviarAudioVisitante() {
    if (!unidadeSelecionada || !audioBlob) {
      alert("Grave um áudio antes de enviar.");
      return;
    }

    const referenciaChamada = ref(
      db,
      `unidades-v2/${unidadeSelecionada.id}/chamada`
    );

    try {
      setEnviandoAudio(true);

      const snapshotChamada = await get(referenciaChamada);
      const chamadaAtual = snapshotChamada.val() || {};
      const statusAtual = chamadaAtual.status || "";

      const chamadaJaAtiva =
        statusAtual &&
        statusAtual !== "Encerrado" &&
        statusAtual !== "Finalizado" &&
        statusAtual !== "Cancelado pelo visitante" &&
        statusAtual !== "Cancelada pelo visitante" &&
        statusAtual !== "Atendimento encerrado";

      if (!chamadaJaAtiva) {
        if (!motivo) {
          alert("Escolha o motivo da chamada antes de enviar o áudio.");
          return;
        }

        if (precisaNome && !nome.trim()) {
          alert("Digite seu nome antes de enviar o áudio.");
          return;
        }

        if (precisaDescricao && !outroMotivo.trim()) {
          alert("Descreva o motivo antes de enviar o áudio.");
          return;
        }
      }

      const audioBase64 = await blobParaBase64(audioBlob);
      const criadoEmMensagem = Date.now();
      const idMensagem = String(criadoEmMensagem);

      if (!chamadaJaAtiva) {
        const motivoFinal = motivo === "Outros" ? outroMotivo.trim() : motivo;
        let nomeFinal = nome.trim();

        if (motivo === "Entrega") nomeFinal = "Entrega";
        if (motivo === "Entrega de comida") nomeFinal = "Entrega de comida";
        if (motivo === "Outros" && !nomeFinal) nomeFinal = "Outro chamado";

        chamadaFoiEnviadaRef.current = true;
        chamadaAtivaRef.current = true;
        ultimoPopupRef.current = "";

        await update(referenciaChamada, {
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
          visualizadoPeloVisitante: false,
        });
      }

      await set(
        ref(
          db,
          `unidades-v2/${unidadeSelecionada.id}/chamada/mensagens/${idMensagem}`
        ),
        {
          autor: "visitante",
          tipo: "audio",
          audioBase64,
          criadoEm: criadoEmMensagem,
        }
      );

      await update(referenciaChamada, {
        audioBase64,
        ultimaAtividade: criadoEmMensagem,
        enviadoEm: criadoEmMensagem,
        ...(chamadaJaAtiva
          ? {}
          : {
              status: "Aguardando atendimento",
              notificar: true,
            }),
      });

      if (!chamadaJaAtiva) {
        try {
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
          console.log("RESPOSTA PUSH V2 - ÁUDIO:", dadosPush);
        } catch (erroPush) {
          console.error("Erro ao enviar push da chamada por áudio:", erroPush);
        }
      }

      setAudioBlob(null);
      setMensagem(
        chamadaJaAtiva
          ? "✅ Áudio enviado para o responsável."
          : `✅ Chamada com áudio enviada para ${unidadeSelecionada.nome}. Aguarde o atendimento.`
      );
    } catch (erro) {
      console.error("Erro ao enviar áudio:", erro);
      alert("Erro ao enviar áudio. Tente novamente.");
    } finally {
      setEnviandoAudio(false);
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

      await remove(
        ref(db, `unidades-v2/${unidadeSelecionada.id}/chamada`)
      );

      setEnviando(false);
      setEnviandoAudio(false);
      setDiagnostico("");
      setBusca("");
      setBlocoSelecionado("");
      setMensagem("");
      setPopupTexto("");
      setPopupAudioBase64("");
      setPopupAudioFoiOuvido(false);
      setMensagensConversa([]);
      setUnidadeSelecionada(null);
      setNome("");
      setMotivo("");
      setOutroMotivo("");
      setAudioBlob(null);
      setGravandoAudio(false);

      chamadaAtivaRef.current = false;
      chamadaFoiEnviadaRef.current = false;
      ultimoPopupRef.current = "";
    } catch (erro) {
      console.error("Erro ao cancelar:", erro);
    }
  }

  function limparSelecao() {
    setMensagensConversa([]);
    setPopupAudioFoiOuvido(false);
    setUnidadeSelecionada(
      localEhResidencia && unidades.length === 1 ? unidades[0] : null
    );
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setDiagnostico("");
    setPopupTexto("");
    setPopupAudioBase64("");
    setAudioBlob(null);
    setGravandoAudio(false);
    chamadaAtivaRef.current = false;
    chamadaFoiEnviadaRef.current = false;
    ultimoPopupRef.current = "";
  }

  function voltarBloco() {
    setMensagensConversa([]);
    setPopupAudioFoiOuvido(false);
    setBlocoSelecionado("");
    setBusca("");
    setUnidadeSelecionada(null);
    setNome("");
    setMotivo("");
    setOutroMotivo("");
    setMensagem("");
    setDiagnostico("");
    setPopupTexto("");
    setPopupAudioBase64("");
    setAudioBlob(null);
    setGravandoAudio(false);
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
              {popupTipo === "encerrado"
                ? "✅"
                : popupTipo === "audio"
                ? "🎧"
                : "💬"}
            </p>

            <h2 className="text-2xl font-black mb-3">
              {popupTipo === "encerrado"
                ? "ATENDIMENTO ENCERRADO"
                : popupTipo === "audio"
                ? "NOVO ÁUDIO"
                : "NOVA MENSAGEM"}
            </h2>

            <p className="text-3xl font-black leading-relaxed py-6">
              {popupTexto}
            </p>

            {popupTipo === "audio" && popupAudioBase64 && (
              <div className="bg-white/15 border border-white/30 rounded-2xl p-4 mb-4">
                <audio
                  controls
                  className="w-full"
                  src={popupAudioBase64}
                  onPlay={async () => {
                    setPopupAudioFoiOuvido(true);

                    if (!unidadeSelecionada) return;

                    await update(
                      ref(
                        db,
                        `unidades-v2/${unidadeSelecionada.id}/chamada`
                      ),
                      {
                        visualizadoPeloVisitante: true,
                        mensagemVisualizada: true,
                        audioOuvidoPeloVisitante: true,
                        audioOuvidoEm: Date.now(),
                      }
                    );
                  }}
                />
              </div>
            )}

            <button
              type="button"
              disabled={popupTipo === "audio" && !popupAudioFoiOuvido}
              onClick={async () => {
                if (popupTipo === "audio" && !popupAudioFoiOuvido) return;

                if (unidadeSelecionada) {
                  await update(
                    ref(
                      db,
                      `unidades-v2/${unidadeSelecionada.id}/chamada`
                    ),
                    {
                      visualizadoPeloVisitante: true,
                    }
                  );
                }

                setPopupTexto("");
                setPopupAudioBase64("");
                setPopupAudioFoiOuvido(false);
              }}
              className={
                popupTipo === "audio" && !popupAudioFoiOuvido
                  ? "mt-7 w-full bg-slate-500 text-slate-300 text-2xl font-black py-5 rounded-2xl cursor-not-allowed"
                  : "mt-7 w-full bg-white text-black text-2xl font-black py-5 rounded-2xl"
              }
            >
              {popupTipo === "audio" && !popupAudioFoiOuvido
                ? "OUÇA O ÁUDIO PRIMEIRO"
                : "ENTENDI"}
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl">
        <section className="bg-slate-900 border border-slate-700 rounded-3xl p-6 mb-5 text-center">
          <p className="text-green-400 font-black text-sm mb-2">
            QR ACESSO • V2
          </p>

          <h1 className="text-3xl font-black">
            {localEhResidencia ? "🏠" : "🏢"} {" "}
            {localCadastro?.nome || "Chamar Unidade"}
          </h1>

          <p className="text-slate-400 mt-2">
            {localEhResidencia
              ? "Informe o motivo da visita para chamar a residência."
              : "Escolha bloco, unidade e motivo da chamada."}
          </p>
        </section>

        {carregando && (
          <section className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
            <p className="text-slate-400">Carregando unidades...</p>
          </section>
        )}

        {!carregando &&
          !localEhResidencia &&
          temBlocos &&
          !blocoSelecionado && (
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
          !localEhResidencia &&
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
              {["Visitante", "Entrega", "Entrega de comida", "Outros"].map(
                (item) => (
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
              className="w-full sticky bottom-4 z-40 bg-green-500 hover:bg-green-400 disabled:bg-gray-500 text-black text-xl font-black py-4 rounded-2xl shadow-2xl"
            >
              {enviando ? "Enviando..." : "🔔 CHAMAR"}
            </button>

            {diagnostico && (
              <div
                className={
                  diagnostico.startsWith("❌")
                    ? "mt-5 bg-red-500/15 border border-red-500 rounded-2xl p-4 text-red-300 font-bold text-center break-words"
                    : diagnostico.startsWith("3/3")
                    ? "mt-5 bg-green-500/15 border border-green-500 rounded-2xl p-4 text-green-300 font-bold text-center"
                    : "mt-5 bg-yellow-500/15 border border-yellow-500 rounded-2xl p-4 text-yellow-200 font-bold text-center"
                }
              >
                {diagnostico}
              </div>
            )}

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

            {mensagensConversa.length > 0 && (
              <div className="mt-5 bg-slate-950 border border-slate-700 rounded-2xl p-4">
                <h3 className="text-lg font-black mb-4">💬 Conversa</h3>

                <div className="space-y-3">
                  {mensagensConversa.map((item) => {
                    const mensagemMorador = item.autor === "morador";

                    return (
                      <div
                        key={item.id}
                        className={
                          mensagemMorador
                            ? "flex justify-start"
                            : "flex justify-end"
                        }
                      >
                        <div
                          className={
                            mensagemMorador
                              ? "max-w-[88%] bg-blue-600 rounded-2xl rounded-bl-md p-3"
                              : "max-w-[88%] bg-green-600 text-black rounded-2xl rounded-br-md p-3"
                          }
                        >
                          <p className="text-xs font-black mb-2 opacity-80">
                            {mensagemMorador ? "Morador" : "Você"}
                          </p>

                          {item.tipo === "texto" && item.texto && (
                            <p className="font-bold break-words">{item.texto}</p>
                          )}

                          {item.tipo === "audio" && item.audioBase64 && (
                            <audio
                              controls
                              className="w-full min-w-[220px]"
                              src={item.audioBase64}
                              onPlay={async () => {
                                if (!unidadeSelecionada || !mensagemMorador) {
                                  return;
                                }

                                await update(
                                  ref(
                                    db,
                                    `unidades-v2/${unidadeSelecionada.id}/chamada`
                                  ),
                                  {
                                    visualizadoPeloVisitante: true,
                                    audioOuvidoPeloVisitante: true,
                                    audioOuvidoEm: Date.now(),
                                  }
                                );
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <button
                onClick={gravandoAudio ? pararGravacao : iniciarGravacao}
                disabled={enviandoAudio}
                className={
                  gravandoAudio
                    ? "w-full bg-red-600 text-white text-xl font-black py-4 rounded-2xl animate-pulse"
                    : "w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500 text-white text-xl font-black py-4 rounded-2xl"
                }
              >
                {gravandoAudio
                  ? "⏹️ PARAR GRAVAÇÃO"
                  : "🎙️ GRAVAR ÁUDIO"}
              </button>

              {audioBlob && (
                <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 space-y-3">
                  <p className="text-blue-300 text-sm font-bold text-center">
                    Áudio gravado. Confira e envie.
                  </p>

                  <audio
                    controls
                    className="w-full"
                    src={URL.createObjectURL(audioBlob)}
                  />

                  <button
                    onClick={enviarAudioVisitante}
                    disabled={enviandoAudio}
                    className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-500 text-white text-xl font-black py-4 rounded-2xl"
                  >
                    {enviandoAudio ? "Enviando..." : "📤 ENVIAR ÁUDIO"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
