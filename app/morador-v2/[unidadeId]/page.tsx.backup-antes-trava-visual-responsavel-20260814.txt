"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getToken } from "firebase/messaging";
import { ref, onValue, update, remove, push, set, get } from "firebase/database";
import { db, messagingPromise } from "../../services/firebase";
import { useLocalAtual } from "@/app/hooks/useLocalAtual";
import { useAuth } from "@/app/context/AuthContext";
import {
  listarResponsaveisDaUnidade,
  recusarEEncaminhar,
  registrarAtendimentoDoResponsavel,
} from "@/app/services/chamadas/MotorEscalonamento";
type MensagemConversa = {
  id?: string;
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
  visualizadoPeloMorador?: boolean;
  visualizadoPeloMoradorEm?: number;
  audioOuvidoPeloMorador?: boolean;
  audioOuvidoPeloMoradorEm?: number;
};

type ComunicadoMorador = {
  id: string;
  condominioId: string;
  condominioNome: string;
  tipo: "comunicado" | "assembleia" | "manutencao" | "emergencia";
  destinatario?:
    | "unidade"
    | "bloco"
    | "moradores"
    | "proprietarios"
    | "inquilinos"
    | "conselho"
    | "administradora"
    | "zeladoria"
    | "portaria";
  unidadeId?: string;
  blocoSelecionado?: string;
  unidadesDestinatarias?: string[];
  titulo: string;
  mensagem: string;
  detalhesModelo?: {
    dataEvento?: string;
    horarioEvento?: string;
    localEvento?: string;
    pauta?: string;
    empresaResponsavel?: string;
    impactoPrevisto?: string;
    tipoEmergencia?: string;
    orientacaoImediata?: string;
  };
  exigeCiencia?: boolean;
  exigirCiencia?: boolean;
  status: "enviado" | "agendado";
  criadoEm: number;
  criadoEmFormatado: string;
  visualizacoes?: Record<
    string,
    {
      unidadeId: string;
      visualizadoEm?: number;
      ciente?: boolean;
      cienteEm?: number;
    }
  >;
};

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function ordenarMensagens(mensagens?: Record<string, MensagemConversa>) {
  if (!mensagens) return [];

  return Object.entries(mensagens)
    .map(([id, mensagem]) => ({ id, ...mensagem }))
    .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
}

function formatarDataComunicado(data?: string) {
  if (!data) return "";

  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

function iconeTipoComunicado(tipo: ComunicadoMorador["tipo"]) {
  if (tipo === "assembleia") return "👥";
  if (tipo === "manutencao") return "🛠️";
  if (tipo === "emergencia") return "🚨";
  return "📢";
}

function textoTipoComunicado(tipo: ComunicadoMorador["tipo"]) {
  if (tipo === "assembleia") return "ASSEMBLEIA";
  if (tipo === "manutencao") return "MANUTENÇÃO";
  if (tipo === "emergencia") return "EMERGÊNCIA";
  return "COMUNICADO";
}

export default function MoradorV2() {
  const params = useParams();
  const searchParams = useSearchParams();

  const {
    usuario,
  } = useAuth();

  const comunicadoIdPeloLink = searchParams.get("comunicado") || "";

  const slug = String(
    params?.unidadeId ||
      params?.slug ||
      params?.id ||
      params?.unidade ||
      "qr1"
  );

  const [nome, setNome] = useState("Nenhuma solicitação");
  const [motivo, setMotivo] = useState("Aguardando visitante");
  const [status, setStatus] = useState("Sem chamado ativo");
  const [horaChamada, setHoraChamada] = useState("");
  const [modo, setModo] = useState("");
  const [mensagemResponsavel, setMensagemResponsavel] = useState("");
  const [historicoLista, setHistoricoLista] = useState<any[]>([]);
  const [avisoAuto, setAvisoAuto] = useState("");
  const [online, setOnline] = useState(true);
  // Recursos opcionais do local.
  // TEMPORARIO: depois estas flags virao do pacote contratado.
  const cameraContratada = false;
  const portaoContratado = false;

  const [fotoCameraAtual, setFotoCameraAtual] = useState("");
  const [fotoCameraAtualizadaEm, setFotoCameraAtualizadaEm] = useState(Date.now());
  const [capturandoCamera, setCapturandoCamera] = useState(false);
  const [abrindoPortao, setAbrindoPortao] = useState(false);
  const [statusPortao, setStatusPortao] = useState("");
  const [visitanteVisualizou, setVisitanteVisualizou] = useState(false);
  const [audioVisitante, setAudioVisitante] = useState("");
  const [mensagensConversa, setMensagensConversa] = useState<MensagemConversa[]>([]);
  const [gravandoAudioMorador, setGravandoAudioMorador] = useState(false);
  const [audioRespostaBlob, setAudioRespostaBlob] = useState<Blob | null>(null);
  const [enviandoAudioMorador, setEnviandoAudioMorador] = useState(false);
  const [popupAudioMoradorAberto, setPopupAudioMoradorAberto] = useState(false);
  const [respostasRapidasAbertas, setRespostasRapidasAbertas] = useState(true);
  const [popupAtendimentoAberto, setPopupAtendimentoAberto] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarCameraGrande, setMostrarCameraGrande] = useState(false);
  const [audioPopup, setAudioPopup] = useState<{
    titulo: string;
    audio: string;
    mensagemId?: string;
    autor?: "visitante" | "morador";
  } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [appInstalavel, setAppInstalavel] = useState(false);
  const [comunicados, setComunicados] = useState<ComunicadoMorador[]>([]);
  const [comunicadoAberto, setComunicadoAberto] =
    useState<ComunicadoMorador | null>(null);
  const [salvandoCiencia, setSalvandoCiencia] = useState(false);

  const intervaloSomRef = useRef<NodeJS.Timeout | null>(null);
  const finalizacaoAutoRef = useRef<NodeJS.Timeout | null>(null);
  const ultimaCapturaCameraRef = useRef("");
  const ultimoAudioPopupRef = useRef("");
  const toqueSilenciadoPorAudioRef = useRef(false);
  const idChamadaAtualRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const ultimaChamadaAtivaRef = useRef(false);
  const ultimaChamadaDadosRef = useRef<any>(null);
  const mediaRecorderMoradorRef = useRef<MediaRecorder | null>(null);
  const audioChunksMoradorRef = useRef<Blob[]>([]);

  function identificarCondominioPeloSlug(unidadeSlug: string) {
    const valor = unidadeSlug.toLowerCase();

    if (valor.includes("residencial-costa")) {
      return "residencial-costa";
    }

    if (valor.includes("tulipas")) return "cnd-tulipas";
    if (valor.includes("flores")) return "cnd-flores";
    if (valor.includes("alfa")) return "cnd-alfa";

    return "cnd-tulipas";
  }

  const {
  localId,
  localNome,
  ehResidencia,
} = useLocalAtual(slug);

const condominioId =
  localId || identificarCondominioPeloSlug(slug);

const nomeLocal =
  localNome || "Morador V2";

  const caminhoComunicados = `comunicados-v2/${condominioId}`;
  const caminhoFirebase = `unidades-v2/${slug}/chamada`;
  const caminhoHistorico = `historico-v2/${slug}`;
  const caminhoStatus = `status-v2/${slug}`;
  const caminhoLogs = `logs-v2/${slug}`;
  const caminhoAnalytics = `analytics-v2/${slug}`;

  const TEMPO_AGUARDANDO = 5 * 60 * 1000;
  const TEMPO_EM_ATENDIMENTO = 3 * 60 * 1000;

  const chamadaAtiva =
    nome !== "Nenhuma solicitação" &&
    status !== "Sem chamado ativo" &&
    status !== "Encerrado";

  const aguardandoAtendimento = status === "Aguardando atendimento";
  const atendimentoEmAndamento = status === "Em atendimento";
  const mostrarPopupChamada = chamadaAtiva && popupAtendimentoAberto && aguardandoAtendimento;

  async function registrarLog(tipo: string, detalhes: string) {
    try {
      const novoLog = push(ref(db, caminhoLogs));

      await set(novoLog, {
        tipo,
        detalhes,
        unidade: slug,
        timestamp: new Date().toISOString(),
        nomeAtual: nome,
        statusAtual: status,
        navegador:
          typeof navigator !== "undefined" ? navigator.userAgent : "indisponivel",
      });
    } catch (erro) {
      console.error("Erro ao salvar log:", erro);
    }
  }

  async function registrarAnalytics(evento: string) {
    try {
      const referencia = ref(db, caminhoAnalytics);
      const snapshot = await get(referencia);

      const dados = snapshot.val() || {
        recebidas: 0,
        atendidas: 0,
        finalizadas: 0,
        timeouts: 0,
        falhas: 0,
      };

      if (evento === "recebida") dados.recebidas++;
      if (evento === "atendida") dados.atendidas++;
      if (evento === "finalizada") dados.finalizadas++;
      if (evento === "timeout") dados.timeouts++;
      if (evento === "falha") dados.falhas++;

      await update(referencia, dados);
    } catch (erro) {
      console.error("Erro analytics:", erro);
    }
  }

  useEffect(() => {
    const referenciaComunicados = ref(db, caminhoComunicados);

    const pararDeOuvirComunicados = onValue(
      referenciaComunicados,
      (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
          setComunicados([]);
          return;
        }

        const agora = Date.now();

        const lista = Object.entries(dados)
          .map(([id, valor]) => ({
            id,
            ...(valor as Omit<ComunicadoMorador, "id">),
          }))
          .filter((comunicado) => {
            const estaDisponivel =
              comunicado.status === "enviado" ||
              (comunicado.status === "agendado" &&
                comunicado.criadoEm <= agora);

            if (!estaDisponivel) return false;

            // Compatibilidade com comunicados antigos, criados antes da
            // separação por público: continuam aparecendo para os moradores.
            if (!comunicado.destinatario) return true;

            if (comunicado.destinatario === "moradores") return true;

            if (comunicado.destinatario === "unidade") {
              return (
                comunicado.unidadeId === slug ||
                comunicado.unidadesDestinatarias?.includes(slug) === true
              );
            }

            if (comunicado.destinatario === "bloco") {
              return comunicado.unidadesDestinatarias?.includes(slug) === true;
            }

            // Públicos próprios não devem aparecer no painel comum do morador.
            return false;
          })
          .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));

        setComunicados(lista);
      }
    );

    return () => pararDeOuvirComunicados();
  }, [caminhoComunicados]);

  useEffect(() => {
    if (!comunicadoIdPeloLink || comunicados.length === 0) return;

    const comunicadoDoLink = comunicados.find(
      (item) => item.id === comunicadoIdPeloLink
    );

    if (!comunicadoDoLink) return;

    abrirComunicado(comunicadoDoLink);
  }, [comunicadoIdPeloLink, comunicados]);

  async function abrirComunicado(comunicado: ComunicadoMorador) {
    setComunicadoAberto(comunicado);

    const visualizacaoAtual =
      comunicado.visualizacoes?.[slug]?.visualizadoEm;

    if (visualizacaoAtual) return;

    try {
      await update(
        ref(
          db,
          `${caminhoComunicados}/${comunicado.id}/visualizacoes/${slug}`
        ),
        {
          unidadeId: slug,
          visualizadoEm: Date.now(),
          ciente: comunicado.visualizacoes?.[slug]?.ciente === true,
        }
      );
    } catch (erro) {
      console.error("Erro ao registrar visualização:", erro);
    }
  }

  async function confirmarCiencia() {
    if (!comunicadoAberto || salvandoCiencia) return;

    try {
      setSalvandoCiencia(true);

      await update(
        ref(
          db,
          `${caminhoComunicados}/${comunicadoAberto.id}/visualizacoes/${slug}`
        ),
        {
          unidadeId: slug,
          visualizadoEm:
            comunicadoAberto.visualizacoes?.[slug]?.visualizadoEm ||
            Date.now(),
          ciente: true,
          cienteEm: Date.now(),
        }
      );

      setComunicadoAberto(null);
      alert("Sua ciência foi registrada com sucesso.");
    } catch (erro) {
      console.error("Erro ao registrar ciência:", erro);
      alert("Não foi possível registrar sua ciência.");
    } finally {
      setSalvandoCiencia(false);
    }
  }

  useEffect(() => {
    const referenciaStatus = ref(db, caminhoStatus);

    const pararDeOuvirStatus = onValue(referenciaStatus, (snapshot) => {
      const dados = snapshot.val();
      if (dados && typeof dados.online === "boolean") {
        setOnline(dados.online);
      }
    });

    return () => pararDeOuvirStatus();
  }, [caminhoStatus]);

  useEffect(() => {
    const referenciaHistorico = ref(db, caminhoHistorico);

    const pararDeOuvirHistorico = onValue(referenciaHistorico, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setHistoricoLista([]);
        return;
      }

      const lista = Object.values(dados) as any[];

      const listaOrdenada = lista
        .sort((a, b) => {
          const dataA = new Date(a.finalizadoEm || 0).getTime();
          const dataB = new Date(b.finalizadoEm || 0).getTime();
          return dataB - dataA;
        })
        .slice(0, 10);

      setHistoricoLista(listaOrdenada);
    });

    return () => pararDeOuvirHistorico();
  }, [caminhoHistorico]);

  useEffect(() => {
    const referencia = ref(db, caminhoFirebase);

    const pararDeOuvir = onValue(referencia, async (snapshot) => {
      const dados = snapshot.val();

      limparFinalizacaoAutomatica();

      if (!dados) {
        if (ultimaChamadaAtivaRef.current && ultimaChamadaDadosRef.current) {
          await registrarAnalytics("falha");
          await registrarLog(
            "chamada_cancelada_visitante",
            "Visitante cancelou antes do atendimento"
          );
          await salvarHistoricoComDados(
            "Cancelada pelo visitante",
            ultimaChamadaDadosRef.current
          );
        }

        ultimaChamadaAtivaRef.current = false;
        ultimaChamadaDadosRef.current = null;

        setNome("Nenhuma solicitação");
        setMotivo("Aguardando visitante");
        setStatus("Sem chamado ativo");
        setHoraChamada("");
        setModo("");
        setMensagemResponsavel("");
        setVisitanteVisualizou(false);
        setAudioVisitante("");
        ultimoAudioPopupRef.current = "";
        setAudioPopup(null);
        setMensagensConversa([]);
        setAudioRespostaBlob(null);
        setAvisoAuto("");
        setPopupAtendimentoAberto(false);
        setRespostasRapidasAbertas(true);
        toqueSilenciadoPorAudioRef.current = false;
        idChamadaAtualRef.current = "";
        pararToqueContinuo();
        return;
      }

      ultimaChamadaAtivaRef.current = true;
      ultimaChamadaDadosRef.current = dados;

      const responsavelAtualUid =
        String(
          dados.responsavelAtualUid ||
          dados.responsavelAtualId ||
          ""
        );

      /*
       * Compatibilidade:
       * chamadas antigas sem responsável individual
       * continuam funcionando como antes.
       *
       * Chamadas novas com responsável definido
       * pertencem somente ao usuário selecionado
       * pelo MotorEscalonamento.
       */
      const chamadaDestinadaAoUsuario =
        !responsavelAtualUid ||
        (
          Boolean(usuario?.uid) &&
          responsavelAtualUid ===
            usuario?.uid
        );

      setNome(dados.nome || "Nenhuma solicitação");
      setMotivo(dados.motivo || "Aguardando visitante");
      setStatus(dados.status || "Sem chamado ativo");
      setHoraChamada(
        dados.criadoEm ? new Date(dados.criadoEm).toLocaleString("pt-BR") : ""
      );
      setModo(dados.modo || "");
      setMensagemResponsavel(dados.mensagemResponsavel || "");

      const idChamadaAtual =
        String(dados.criadoEm || "") ||
        `${dados.nome || ""}-${dados.motivo || ""}`;

      if (
        idChamadaAtual &&
        idChamadaAtualRef.current !== idChamadaAtual
      ) {
        idChamadaAtualRef.current = idChamadaAtual;
        toqueSilenciadoPorAudioRef.current = false;
      }
      setVisitanteVisualizou(
        dados.visitanteVisualizou === true ||
          dados.mensagemVisualizada === true ||
          dados.visualizadoPeloVisitante === true
      );

      const mensagensOrdenadas = ordenarMensagens(dados.mensagens);
      setMensagensConversa(mensagensOrdenadas);

      const ultimoAudioVisitante = [...mensagensOrdenadas]
        .reverse()
        .find(
          (item) =>
            item.autor === "visitante" &&
            item.tipo === "audio" &&
            Boolean(item.audioBase64)
        );

      const audioVisitanteAtual = ultimoAudioVisitante?.audioBase64 || dados.audioBase64 || "";
      setAudioVisitante(audioVisitanteAtual);

      if (
        chamadaDestinadaAoUsuario &&
        audioVisitanteAtual &&
        ultimoAudioPopupRef.current !== audioVisitanteAtual
      ) {
        ultimoAudioPopupRef.current = audioVisitanteAtual;

        setAudioPopup({
          titulo: "🎙️ Novo áudio do visitante",
          audio: audioVisitanteAtual,
          mensagemId: ultimoAudioVisitante?.id,
          autor: "visitante",
        });
      }

      if (dados.status === "Encerrado") {
        ultimaChamadaAtivaRef.current = false;
        ultimaChamadaDadosRef.current = null;

        pararToqueContinuo();
        setPopupAtendimentoAberto(false);
        setAvisoAuto("Atendimento encerrado. Limpando em instantes.");
        return;
      }

      const deveTocar =
        chamadaDestinadaAoUsuario &&
        dados.notificar === true &&
        dados.status === "Aguardando atendimento" &&
        !toqueSilenciadoPorAudioRef.current;

      if (deveTocar) {
        iniciarToqueContinuo();
        setPopupAtendimentoAberto(true);

        const idChamada = dados.criadoEm || dados.nome || "";

        if (idChamada && ultimaCapturaCameraRef.current !== idChamada) {
          ultimaCapturaCameraRef.current = idChamada;

          registrarAnalytics("recebida");
          registrarLog("chamada_recebida", "Nova chamada recebida no painel");

          if (cameraContratada) {
            capturarFotoCamera();
          }
        }
      } else {
        pararToqueContinuo();

        if (!chamadaDestinadaAoUsuario) {
          setPopupAtendimentoAberto(false);
        }
      }

      if (chamadaDestinadaAoUsuario) {
        programarFinalizacaoAutomatica(
          dados
        );
      } else {
        limparFinalizacaoAutomatica();
        setAvisoAuto("");
      }
    });

    return () => {
      limparFinalizacaoAutomatica();
      pararToqueContinuo();
      pararDeOuvir();
    };
  }, [
    caminhoFirebase,
    usuario?.uid,
  ]);

  async function capturarFotoCamera() {
    setCapturandoCamera(true);

    try {
      await registrarLog("camera_tentativa", "Tentando capturar foto da câmera");

      const resposta = await fetch(`/api/capturar-camera?cache=${Date.now()}`);
      const dados = await resposta.json();

      if (dados.sucesso && dados.imagem) {
        setFotoCameraAtual(dados.imagem);
        setFotoCameraAtualizadaEm(Date.now());

        await registrarLog(
          "camera_sucesso",
          "Foto da câmera capturada com sucesso"
        );
      } else {
        await registrarLog("erro_camera", "A câmera não retornou imagem válida");
        console.log("A câmera não retornou imagem.");
      }
    } catch (erro) {
      console.error("Erro ao capturar foto da câmera:", erro);

      await registrarLog(
        "erro_camera",
        "Erro ao atualizar foto da câmera: " + String(erro)
      );

      alert("Erro ao atualizar foto da câmera.");
    }

    setCapturandoCamera(false);
  }

  async function salvarHistoricoComDados(tipoFinalizacao: string, dados: any) {
    if (!dados || !dados.nome) return;

    const agora = new Date();

    const novoRegistro = {
      nome: dados.nome || "Visitante",
      motivo: dados.motivo || "Não informado",
      modo: dados.modo || "",
      statusFinal: dados.status || "Sem status",
      tipoFinalizacao,
      chamadoEm: dados.criadoEm
        ? new Date(dados.criadoEm).toLocaleString("pt-BR")
        : "",
      finalizadoEm: agora.toISOString(),
      finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
      fotoCamera: fotoCameraAtual || "",
    };

    const novoItem = push(ref(db, caminhoHistorico));
    await set(novoItem, novoRegistro);
  }

  async function salvarHistorico(tipoFinalizacao: string) {
    if (nome === "Nenhuma solicitação") return;

    const agora = new Date();

    const novoRegistro = {
      nome,
      motivo,
      modo,
      statusFinal: status,
      tipoFinalizacao,
      chamadoEm: horaChamada,
      finalizadoEm: agora.toISOString(),
      finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
      fotoCamera: fotoCameraAtual || "",
    };

    const novoItem = push(ref(db, caminhoHistorico));
    await set(novoItem, novoRegistro);
  }

  function programarFinalizacaoAutomatica(dados: any) {
    if (dados.status === "Encerrado") return;

    const agora = Date.now();

    let tempoLimite = TEMPO_AGUARDANDO;

    /*
     * Enquanto estiver aguardando, cada responsavel recebe
     * sua propria janela de atendimento.
     *
     * escalonamentoAtualizadoEm muda quando a prioridade
     * passa para o proximo responsavel.
     */
    let dataBase =
      dados.escalonamentoAtualizadoEm ||
      dados.criadoEm;

    if (dados.status === "Em atendimento") {
      tempoLimite = TEMPO_EM_ATENDIMENTO;
      dataBase =
        dados.atendidoEm ||
        dados.criadoEm;
    }

    if (!dataBase) return;

    const inicio = new Date(dataBase).getTime();
    const tempoPassado = agora - inicio;
    const tempoRestante = tempoLimite - tempoPassado;

    if (tempoRestante <= 0) {
      finalizarAutomaticamente();
      return;
    }

    const minutos = Math.ceil(tempoRestante / 60000);
    setAvisoAuto(`Finalização automática em até ${minutos} min.`);

    finalizacaoAutoRef.current = setTimeout(() => {
      finalizarAutomaticamente();
    }, tempoRestante);
  }

  async function finalizarAutomaticamente() {
    pararToqueContinuo();
    limparFinalizacaoAutomatica();

    /*
     * Protecao contra timer antigo.
     *
     * Antes de encerrar qualquer chamada, confirmamos que:
     * - ela ainda existe;
     * - ainda esta aguardando/em atendimento;
     * - ainda pertence ao usuario deste aparelho;
     * - continua sendo a mesma chamada observada.
     */
    try {
      const snapshotAtual =
        await get(
          ref(
            db,
            caminhoFirebase
          )
        );

      const chamadaAtual =
        snapshotAtual.val();

      if (!chamadaAtual) {
        return;
      }

      const responsavelAtualUid =
        String(
          chamadaAtual.responsavelAtualUid ||
          chamadaAtual.responsavelAtualId ||
          ""
        );

      if (
        responsavelAtualUid &&
        responsavelAtualUid !==
          usuario?.uid
      ) {
        return;
      }

      if (
        chamadaAtual.status !==
          "Aguardando atendimento" &&
        chamadaAtual.status !==
          "Em atendimento"
      ) {
        return;
      }

      const chamadaObservada =
        ultimaChamadaDadosRef.current;

      if (
        chamadaObservada?.criadoEm &&
        chamadaAtual.criadoEm !==
          chamadaObservada.criadoEm
      ) {
        return;
      }
    } catch (erro) {
      console.error(
        "Erro ao validar chamada antes do timeout:",
        erro
      );

      /*
       * Em caso de duvida, nao apagamos uma chamada.
       */
      return;
    }

    const timeoutAguardando =
      status ===
      "Aguardando atendimento";

    ultimaChamadaAtivaRef.current = false;
    setPopupAtendimentoAberto(false);
    setStatus("Encerrado");
    setAvisoAuto("Atendimento encerrado. Limpando em instantes.");

    try {
      await update(ref(db, caminhoFirebase), {
        status: "Encerrado",
        mensagemResponsavel: timeoutAguardando
          ? "Tempo de espera esgotado."
          : "ATENDIMENTO_ENCERRADO",
        notificar: false,
        encerradoEm: new Date().toISOString(),
      });
    } catch (erro) {
      console.error("Erro ao encerrar chamada automaticamente:", erro);
    }

    ultimaChamadaDadosRef.current = null;
    setAudioVisitante("");
    setMensagensConversa([]);
    setAudioRespostaBlob(null);

    void Promise.allSettled([
      registrarAnalytics("timeout"),
      registrarLog(
        "timeout_atendimento",
        "Chamada finalizada automaticamente"
      ),
      salvarHistorico(timeoutAguardando ? "Não atendida" : "Automática"),
    ]);

    const identificadorEncerramento =
      new Date().toISOString();

    setTimeout(async () => {
      try {
        const snapshotAtual =
          await get(
            ref(
              db,
              caminhoFirebase
            )
          );

        if (!snapshotAtual.exists()) {
          return;
        }

        const chamadaAtual =
          snapshotAtual.val();

        /*
         * Nunca permite que o timer de uma chamada antiga
         * apague uma chamada nova que nasceu no mesmo caminho.
         */
        if (
          chamadaAtual?.status !==
          "Encerrado"
        ) {
          return;
        }

        await remove(
          ref(
            db,
            caminhoFirebase
          )
        );
      } catch (erro) {
        console.error(
          "Erro ao limpar chamada encerrada:",
          erro
        );
      }
    }, 2000);
  }

  function limparFinalizacaoAutomatica() {
    if (finalizacaoAutoRef.current) {
      clearTimeout(finalizacaoAutoRef.current);
      finalizacaoAutoRef.current = null;
    }
  }

  async function atenderSolicitacao() {
  if (status === "Sem chamado ativo") {
    alert("Não existe chamada ativa para atender.");
    return;
  }

  if (status === "Em atendimento") {
    alert("Esta chamada já está em atendimento.");
    return;
  }

  setPopupAtendimentoAberto(false);
  pararToqueContinuo();

  try {
    const chamadaSnapshot =
      await get(
        ref(
          db,
          caminhoFirebase
        )
      );

    const chamadaAtual =
      chamadaSnapshot.val() || {};

    const responsavelAtualId =
      String(
        chamadaAtual.responsavelAtualId ||
        ""
      );

    const responsavelAtualUid =
      String(
        chamadaAtual.responsavelAtualUid ||
        responsavelAtualId ||
        ""
      );

    if (
      responsavelAtualUid &&
      responsavelAtualUid !==
        usuario?.uid
    ) {
      alert(
        "Esta chamada esta destinada a outro responsavel."
      );

      return;
    }

    /*
     * Enquanto ainda não houver responsável individual
     * definido na chamada, preserva o funcionamento atual.
     */
    if (!responsavelAtualId) {
      await update(
        ref(
          db,
          caminhoFirebase
        ),
        {
          status:
            "Em atendimento",

          notificar:
            false,

          atendidoEm:
            new Date().toISOString(),

          ultimaAtividade:
            Date.now(),
        }
      );
    } else {
      const responsaveis =
        await listarResponsaveisDaUnidade(
          slug
        );

      const responsavelAtual =
        responsaveis.find(
          (
            responsavel
          ) =>
            responsavel.id ===
            responsavelAtualId
        );

      if (!responsavelAtual) {
        throw new Error(
          "O responsável atual da chamada não foi encontrado."
        );
      }

      await registrarAtendimentoDoResponsavel(
        caminhoFirebase,
        responsavelAtual
      );
    }

    setStatus(
      "Em atendimento"
    );

    setRespostasRapidasAbertas(true);

    void Promise.allSettled([
      registrarAnalytics(
        "atendida"
      ),

      registrarLog(
        "chamada_atendida",
        responsavelAtualId
          ? `Chamada atendida pelo responsável ${responsavelAtualId}`
          : "Chamada atendida pelo painel"
      ),
    ]);
  } catch (erro) {
    console.error(
      "Erro ao atender chamada:",
      erro
    );

    alert(
      erro instanceof Error
        ? erro.message
        : "Não foi possível confirmar o atendimento."
    );
  }
}
async function naoPossoAtender() {
  if (
    status ===
    "Sem chamado ativo"
  ) {
    alert(
      "Não existe chamada ativa."
    );

    return;
  }

  pararToqueContinuo();
  setPopupAtendimentoAberto(
    false
  );

  try {
    const chamadaSnapshot =
      await get(
        ref(
          db,
          caminhoFirebase
        )
      );

    const chamadaAtual =
      chamadaSnapshot.val() || {};

    const responsavelAtualId =
      String(
        chamadaAtual.responsavelAtualId ||
        ""
      );

    const responsavelAtualUid =
      String(
        chamadaAtual.responsavelAtualUid ||
        responsavelAtualId ||
        ""
      );

    if (
      responsavelAtualUid &&
      responsavelAtualUid !==
        usuario?.uid
    ) {
      alert(
        "Esta chamada esta destinada a outro responsavel."
      );

      return;
    }

    if (!responsavelAtualId) {
      alert(
        "A chamada ainda não possui um responsável individual definido."
      );

      setPopupAtendimentoAberto(
        true
      );

      return;
    }

    const resultado =
      await recusarEEncaminhar(
        slug,
        caminhoFirebase,
        responsavelAtualId
      );

    await registrarLog(
      "chamada_recusada",
      `Responsável ${responsavelAtualId} informou que não pode atender.`
    );

    if (
      resultado.sucesso &&
      resultado.responsavel
    ) {
      /*
       * O MotorEscalonamento ja concluiu a transferencia.
       * Agora a API consulta o novo responsavelAtualUid
       * e envia o push ao proximo responsavel.
       */
      try {
        const respostaPush =
          await fetch(
            "/api/enviar-notificacao-v2",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  unidadeId:
                    slug,
                }),
            }
          );

        const dadosPush =
          await respostaPush
            .json()
            .catch(
              () => null
            );

        console.log(
          "PUSH APOS TRANSFERENCIA:",
          dadosPush
        );
      } catch (erroPush) {
        console.error(
          "Erro ao enviar push para o proximo responsavel:",
          erroPush
        );
      }

      alert(
        `Chamada encaminhada para ${resultado.responsavel.nome}.`
      );

      return;
    }

    alert(
      resultado.motivo ||
      "Não existe outro responsável disponível no momento."
    );
  } catch (erro) {
    console.error(
      "Erro ao encaminhar chamada:",
      erro
    );

    setPopupAtendimentoAberto(
      true
    );

    alert(
      erro instanceof Error
        ? erro.message
        : "Não foi possível encaminhar a chamada."
    );
  }
}
  useEffect(() => {
    if (status !== "Em atendimento") return;

    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    const mensagensPendentes = mensagensConversa.filter(
      (item) =>
        item.autor === "visitante" &&
        item.tipo === "texto" &&
        Boolean(item.id) &&
        item.visualizadoPeloMorador !== true
    );

    if (mensagensPendentes.length === 0) return;

    Promise.all(
      mensagensPendentes.map((item) =>
        update(
          ref(db, `${caminhoFirebase}/mensagens/${item.id}`),
          {
            visualizadoPeloMorador: true,
            visualizadoPeloMoradorEm: Date.now(),
          }
        )
      )
    ).catch((erro) => {
      console.error(
        "Erro ao registrar leitura das mensagens pelo morador:",
        erro
      );
    });
  }, [mensagensConversa, status, caminhoFirebase]);

  async function enviarMensagemRapida(mensagem: string) {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para responder.");
      return;
    }

    if (status !== "Em atendimento") {
      alert("Atenda a chamada antes de responder.");
      return;
    }

    await registrarLog("mensagem_rapida", "Mensagem enviada: " + mensagem);

    await update(ref(db, caminhoFirebase), {
      status: "Em atendimento",
      mensagemResponsavel: mensagem,
      notificar: false,
      visitanteVisualizou: false,
      mensagemVisualizada: false,
      visualizadoPeloVisitante: false,
      enviadoEm: Date.now(),
      ultimaAtividade: Date.now(),
      atendidoEm: new Date().toISOString(),
    });

    await registrarMensagemConversa({
      autor: "morador",
      tipo: "texto",
      texto: mensagem,
    });

    setMensagemResponsavel(mensagem);
    setVisitanteVisualizou(false);
    setRespostasRapidasAbertas(false);
    pararToqueContinuo();
  }

  async function registrarMensagemConversa(
    dados: Omit<MensagemConversa, "criadoEm">
  ) {
    if (status === "Sem chamado ativo") return;

    const idMensagem = String(Date.now());

    await set(ref(db, `${caminhoFirebase}/mensagens/${idMensagem}`), {
      ...dados,
      criadoEm: Date.now(),
    });

    await update(ref(db, caminhoFirebase), {
      ultimaAtividade: Date.now(),
      enviadoEm: Date.now(),
    });
  }

  async function iniciarGravacaoMorador() {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para responder.");
      return;
    }

    if (status !== "Em atendimento") {
      alert("Atenda a chamada antes de gravar resposta.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksMoradorRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksMoradorRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        /*
         * Usa o formato real produzido pelo navegador.
         * Firefox normalmente pode gravar em audio/ogg,
         * enquanto Chrome costuma usar audio/webm.
         * Forçar audio/webm em todos os navegadores pode
         * fazer o áudio chegar sem som no aparelho visitante.
         */
        const tipoAudio =
          recorder.mimeType ||
          audioChunksMoradorRef.current[0]?.type ||
          "audio/webm";

        const blob = new Blob(
          audioChunksMoradorRef.current,
          {
            type: tipoAudio,
          }
        );

        setAudioRespostaBlob(blob);
        setGravandoAudioMorador(false);
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
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
      setPopupAudioMoradorAberto(false);
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
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para responder.");
      return;
    }

    if (status !== "Em atendimento") {
      alert("Atenda a chamada antes de enviar áudio.");
      return;
    }

    if (!audioRespostaBlob) {
      alert("Grave um áudio antes de enviar.");
      return;
    }

    try {
      setEnviandoAudioMorador(true);

      const audioBase64 = await blobParaBase64(audioRespostaBlob);

      await update(ref(db, caminhoFirebase), {
        status: "Em atendimento",
        notificar: false,
        mensagemResponsavel: "",
        visualizadoPeloVisitante: false,
        visitanteVisualizou: false,
        mensagemVisualizada: false,
        enviadoEm: Date.now(),
        ultimaAtividade: Date.now(),
        atendidoEm: new Date().toISOString(),
      });

      await registrarMensagemConversa({
        autor: "morador",
        tipo: "audio",
        audioBase64,
      });

      await registrarLog("audio_morador", "Morador enviou áudio ao visitante");

      setAudioRespostaBlob(null);
      setPopupAudioMoradorAberto(false);
      pararToqueContinuo();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao enviar áudio.");
    } finally {
      setEnviandoAudioMorador(false);
    }
  }

  async function limparHistorico() {
    const confirmar = window.confirm(
      "Tem certeza que deseja limpar todo o histórico?"
    );

    if (!confirmar) return;

    await remove(ref(db, caminhoHistorico));
    setHistoricoLista([]);
    alert("Histórico limpo com sucesso.");
  }

  async function finalizarSolicitacao() {
    if (status === "Sem chamado ativo") {
      alert("Não existe chamada ativa para finalizar.");
      return;
    }

    limparFinalizacaoAutomatica();
    pararToqueContinuo();

    ultimaChamadaAtivaRef.current = false;
    setPopupAtendimentoAberto(false);
    setStatus("Encerrado");
    setAvisoAuto("Atendimento encerrado. Limpando em instantes.");

    try {
      await update(ref(db, caminhoFirebase), {
        status: "Encerrado",
        mensagemResponsavel: "ATENDIMENTO_ENCERRADO",
        notificar: false,
        encerradoEm: new Date().toISOString(),
      });
    } catch (erro) {
      console.error("Erro ao finalizar chamada:", erro);
      alert("Não foi possível finalizar o atendimento.");
      return;
    }

    ultimaChamadaDadosRef.current = null;

    void Promise.allSettled([
      registrarAnalytics("finalizada"),
      registrarLog(
        "chamada_finalizada",
        "Chamada finalizada manualmente"
      ),
      salvarHistorico("Manual"),
    ]);

    const identificadorEncerramento =
      new Date().toISOString();

    setTimeout(async () => {
      try {
        const snapshotAtual =
          await get(
            ref(
              db,
              caminhoFirebase
            )
          );

        if (!snapshotAtual.exists()) {
          return;
        }

        const chamadaAtual =
          snapshotAtual.val();

        /*
         * Nunca permite que o timer de uma chamada antiga
         * apague uma chamada nova que nasceu no mesmo caminho.
         */
        if (
          chamadaAtual?.status !==
          "Encerrado"
        ) {
          return;
        }

        await remove(
          ref(
            db,
            caminhoFirebase
          )
        );
      } catch (erro) {
        console.error(
          "Erro ao limpar chamada encerrada:",
          erro
        );
      }
    }, 2000);
  }

  function tocarBip() {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.45
      );

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.45);
    } catch (erro) {
      console.error("Erro ao tocar bip:", erro);
    }
  }

  function iniciarToqueContinuo() {
    if (intervaloSomRef.current) return;

    tocarBip();

    intervaloSomRef.current = setInterval(() => {
      tocarBip();
    }, 900);
  }

  function pararToqueContinuo() {
    if (intervaloSomRef.current) {
      clearInterval(intervaloSomRef.current);
      intervaloSomRef.current = null;
    }
  }

  async function alterarStatusOnline() {
    const novoStatus = !online;

    setOnline(novoStatus);

    await set(ref(db, caminhoStatus), {
      online: novoStatus,
      atualizadoEm: new Date().toISOString(),
    });
  }

  async function acionarPortao() {
    if (abrindoPortao) return;

    try {
      setAbrindoPortao(true);
      setStatusPortao("⏳ Abrindo portão...");

      await registrarLog("portao_tentativa", "Tentativa de abertura do portão");

      const resposta = await fetch("/api/abrir-portao");
      const dados = await resposta.json();

      if (dados.success) {
        setStatusPortao("✅ Portão aberto com sucesso");
        await registrarLog("portao_sucesso", "Portão aberto com sucesso");
      } else {
        setStatusPortao("❌ Falha ao abrir portão");
        await registrarLog(
          "erro_portao",
          "API respondeu falha ao abrir portão"
        );
      }
    } catch (erro) {
      setStatusPortao("❌ Erro ao abrir portão");

      await registrarLog("erro_portao", "Erro inesperado: " + String(erro));

      console.error("Erro ao abrir portão:", erro);
    } finally {
      setTimeout(() => {
        setAbrindoPortao(false);
        setStatusPortao("");
      }, 7000);
    }
  }

  async function ativarNotificacoes() {
    try {
      if (typeof window === "undefined") {
        alert("As notificações só podem ser ativadas no navegador.");
        return;
      }

      if (!("Notification" in window)) {
        await registrarLog(
          "push_nao_suportado",
          "Este navegador não possui suporte à API de notificações"
        );

        alert("Este navegador não suporta notificações.");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        await registrarLog(
          "push_sem_service_worker",
          "Este navegador não possui suporte a Service Worker"
        );

        alert("Este navegador não suporta notificações em segundo plano.");
        return;
      }

      const messaging = await messagingPromise;

      if (!messaging) {
        await registrarLog(
          "push_nao_suportado",
          "Firebase Messaging não foi inicializado neste navegador"
        );

        alert("Não foi possível iniciar as notificações neste navegador.");
        return;
      }

      const permissao = await Notification.requestPermission();

      if (permissao !== "granted") {
        await registrarLog(
          "push_permissao_negada",
          "Permissão para notificações negada: " + permissao
        );

        alert("Permissão para notificações não foi concedida.");
        return;
      }

      const registroServiceWorker = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        }
      );

      await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
  serviceWorkerRegistration: registroServiceWorker,
});
      if (!token) {
        throw new Error(
          "O Firebase não retornou um token de notificação."
        );
      }
      const condominioId =
        identificarCondominioPeloSlug(
          slug
        );

      /*
       * Compatibilidade com Tulipas e fluxos legados.
       * Mantemos temporariamente o token antigo por unidade.
       */
      await set(
        ref(
          db,
          `configuracoes-v2/tokensMorador/${slug}`
        ),
        {
          token,
          unidadeId: slug,
          condominioId,
          atualizadoEm: Date.now(),
        }
      );

      /*
       * Token individual do QR Core.
       *
       * Cada usuario pode possuir varios dispositivos.
       * O identificador fica salvo neste navegador/PWA
       * e nao depende da unidade.
       */
      if (usuario?.uid) {
        const chaveDeviceId =
          "qr-core:device-id";

        let deviceId =
          window.localStorage.getItem(
            chaveDeviceId
          ) || "";

        if (!deviceId) {
          deviceId =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
              "function"
              ? crypto.randomUUID()
              : `device-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}`;

          window.localStorage.setItem(
            chaveDeviceId,
            deviceId
          );
        }

        await set(
          ref(
            db,
            `configuracoes-v2/tokensUsuarios/${usuario.uid}/${deviceId}`
          ),
          {
            token,
            uid:
              usuario.uid,

            deviceId,

            unidadeId:
              slug,

            condominioId,

            ativo:
              true,

            atualizadoEm:
              Date.now(),
          }
        );
      }

      await registrarLog(
        "push_token_salvo",
        "Token de notificação salvo com sucesso"
      );

      alert("Notificações ativadas com sucesso!");
    } catch (erro: any) {
      console.error("Erro completo ao ativar notificações:", erro);

      const codigo =
        erro?.code ||
        erro?.name ||
        "erro-desconhecido";

      const mensagemErro =
        erro?.message ||
        String(erro);

      await registrarLog(
        "push_erro_token",
        `Código: ${codigo} | Mensagem: ${mensagemErro}`
      );

      alert(
        `Não foi possível ativar as notificações.

Código: ${codigo}
Mensagem: ${mensagemErro}`
      );
    }
  }

  useEffect(() => {
    function prepararInstalacao(evento: any) {
      evento.preventDefault();
      setInstallPrompt(evento);
      setAppInstalavel(true);
    }

    function appInstalado() {
      setInstallPrompt(null);
      setAppInstalavel(false);
    }

    window.addEventListener("beforeinstallprompt", prepararInstalacao);
    window.addEventListener("appinstalled", appInstalado);

    return () => {
      window.removeEventListener("beforeinstallprompt", prepararInstalacao);
      window.removeEventListener("appinstalled", appInstalado);
    };
  }, []);

  async function instalarApp() {
    if (!installPrompt) {
      alert(
        "Se o botão não abrir a instalação automaticamente, use o menu do navegador e procure por 'Instalar app' ou 'Adicionar à tela inicial'."
      );
      return;
    }

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setAppInstalavel(false);
    } catch (erro) {
      console.error("Erro ao instalar app:", erro);
      alert("Não foi possível abrir a instalação agora.");
    }
  }

  async function abrirCameraGrande() {
    setMostrarCameraGrande(true);

    if (!fotoCameraAtual) {
      await capturarFotoCamera();
    }
  }

  function silenciarToqueAoOuvirAudio() {
    toqueSilenciadoPorAudioRef.current = true;
    pararToqueContinuo();
  }

  function abrirAudioVisitanteGrande() {
    if (!audioVisitante) return;

    silenciarToqueAoOuvirAudio();
    setAudioPopup({
      titulo: "🎙️ Áudio do visitante",
      audio: audioVisitante,
    });
  }

  const respostasRapidas = [
    {
      texto: "Aguarde um momento",
      mensagem: "Aguarde um momento, por favor.",
      icone: "💬",
    },
    {
      texto: "Já estou descendo",
      mensagem: "Olá, entendi. Já estou descendo.",
      icone: "🚶",
    },
    {
      texto: "Pode deixar na portaria",
      mensagem: "Pode deixar na portaria, obrigado.",
      icone: "📦",
    },
    {
      texto: "Não estou em casa",
      mensagem: "Não estou em casa no momento.",
      icone: "🏠",
    },
    {
      texto: "Estou indo retirar",
      mensagem: "Estou indo retirar agora.",
      icone: "🚶",
    },
  ];

  const ultimaMensagemMoradorId =
    [...mensagensConversa]
      .reverse()
      .find((item) => item.autor === "morador")?.id || "";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 relative">
      {comunicadoAberto && (() => {
        const precisaConfirmarCiencia =
          comunicadoAberto.exigeCiencia !== false &&
          comunicadoAberto.exigirCiencia !== false;

        const detalhes = comunicadoAberto.detalhesModelo || {};
        const temInformacoesRapidas =
          Boolean(detalhes.dataEvento) ||
          Boolean(detalhes.horarioEvento) ||
          Boolean(detalhes.localEvento) ||
          Boolean(detalhes.empresaResponsavel);

        const ehEmergencia = comunicadoAberto.tipo === "emergencia";

        return (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-black/90 p-4">
            <div
              className={`my-4 w-full max-w-md overflow-hidden rounded-3xl border-2 bg-slate-900 shadow-2xl ${
                ehEmergencia ? "border-red-500" : "border-blue-500"
              }`}
            >
              <div
                className={`p-5 ${
                  ehEmergencia
                    ? "bg-gradient-to-r from-red-950 to-slate-900"
                    : "bg-gradient-to-r from-blue-950 to-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-xs font-black ${
                        ehEmergencia ? "text-red-300" : "text-blue-300"
                      }`}
                    >
                      {iconeTipoComunicado(comunicadoAberto.tipo)}{" "}
                      {textoTipoComunicado(comunicadoAberto.tipo)}
                    </p>

                    <h2 className="mt-2 text-2xl font-black leading-tight text-white">
                      {comunicadoAberto.titulo}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setComunicadoAberto(null)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/90 text-xl font-black"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-5">
                {temInformacoesRapidas && (
                  <div className="grid grid-cols-2 gap-3">
                    {detalhes.dataEvento && (
                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3">
                        <p className="text-[10px] font-black text-slate-400">
                          📅 DATA
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {formatarDataComunicado(detalhes.dataEvento)}
                        </p>
                      </div>
                    )}

                    {detalhes.horarioEvento && (
                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3">
                        <p className="text-[10px] font-black text-slate-400">
                          🕗 HORÁRIO
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {detalhes.horarioEvento}
                        </p>
                      </div>
                    )}

                    {detalhes.localEvento && (
                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3">
                        <p className="text-[10px] font-black text-slate-400">
                          📍 LOCAL
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {detalhes.localEvento}
                        </p>
                      </div>
                    )}

                    {detalhes.empresaResponsavel && (
                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3">
                        <p className="text-[10px] font-black text-slate-400">
                          👷 RESPONSÁVEL
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {detalhes.empresaResponsavel}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {detalhes.pauta && (
                  <div className="mt-4 rounded-2xl border border-violet-800 bg-violet-950/25 p-4">
                    <p className="text-xs font-black text-violet-300">
                      📋 PAUTA
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                      {detalhes.pauta}
                    </p>
                  </div>
                )}

                {detalhes.impactoPrevisto && (
                  <div className="mt-4 rounded-2xl border border-orange-800 bg-orange-950/25 p-4">
                    <p className="text-xs font-black text-orange-300">
                      ⚠️ IMPACTO PREVISTO
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                      {detalhes.impactoPrevisto}
                    </p>
                  </div>
                )}

                {detalhes.tipoEmergencia && (
                  <div className="mt-4 rounded-2xl border border-red-800 bg-red-950/30 p-4">
                    <p className="text-xs font-black text-red-300">
                      🚨 TIPO DA EMERGÊNCIA
                    </p>
                    <p className="mt-2 text-base font-black text-white">
                      {detalhes.tipoEmergencia}
                    </p>
                  </div>
                )}

                {detalhes.orientacaoImediata && (
                  <div className="mt-4 rounded-2xl border border-red-700 bg-red-950/40 p-4">
                    <p className="text-xs font-black text-red-300">
                      ⚡ ORIENTAÇÃO IMEDIATA
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-relaxed text-white">
                      {detalhes.orientacaoImediata}
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {comunicadoAberto.mensagem}
                  </p>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Enviado em {comunicadoAberto.criadoEmFormatado}
                </p>

                {precisaConfirmarCiencia ? (
                  comunicadoAberto.visualizacoes?.[slug]?.ciente === true ? (
                    <div className="mt-5 rounded-xl border border-green-700 bg-green-950/30 p-4 text-center font-black text-green-300">
                      ✅ Ciente registrado
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={confirmarCiencia}
                      disabled={salvandoCiencia}
                      className={`mt-5 w-full rounded-2xl py-4 text-lg font-black text-white disabled:bg-slate-600 ${
                        ehEmergencia
                          ? "bg-red-600 hover:bg-red-500"
                          : "bg-green-600 hover:bg-green-500"
                      }`}
                    >
                      {salvandoCiencia
                        ? "Registrando..."
                        : ehEmergencia
                        ? "🚨 Confirmo que li e estou ciente"
                        : "✅ Li e estou ciente"}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setComunicadoAberto(null)}
                    className="mt-5 w-full rounded-2xl bg-blue-600 py-4 font-black text-white"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {mostrarPopupChamada && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border-4 border-green-400 rounded-3xl p-5 text-center shadow-2xl my-4">
            <p className="text-6xl mb-3">🚨</p>

            <h2 className="text-3xl font-black text-green-400 mb-2">
              CHAMADA RECEBIDA
            </h2>

            <div className="bg-slate-800 rounded-2xl p-4 mt-4 border border-green-500/30">
              <p className="text-2xl font-black text-white">{nome}</p>
              <p className="text-slate-300 mt-2">Motivo: {motivo}</p>

              {audioVisitante && (
                <div className="mt-4 bg-slate-900 rounded-2xl p-4 border border-blue-500/40">
                  <p className="text-sm text-blue-300 font-bold mb-3">
                    🎙️ Áudio do visitante
                  </p>

                  <audio
                    controls
                    className="w-full"
                    src={audioVisitante}
                    onPointerDown={silenciarToqueAoOuvirAudio}
                    onTouchStart={silenciarToqueAoOuvirAudio}
                    onClick={silenciarToqueAoOuvirAudio}
                    onPlay={silenciarToqueAoOuvirAudio}
                    onPlaying={silenciarToqueAoOuvirAudio}
                  />
                </div>
              )}

              <p className="text-yellow-400 mt-2 font-bold">Status: {status}</p>
            </div>

            <div className="mt-4 bg-slate-800 rounded-2xl p-3">
              <p className="text-green-400 text-sm font-bold mb-2">
                📷 Câmera do portão
              </p>

              {fotoCameraAtual ? (
                <img
                  src={`${fotoCameraAtual}?t=${fotoCameraAtualizadaEm}`}
                  alt="Câmera do portão"
                  className="w-full rounded-xl border border-slate-600"
                />
              ) : (
                <p className="text-slate-400 text-sm">Capturando imagem...</p>
              )}
            </div>

            <button
              onClick={atenderSolicitacao}
              className="w-full mt-5 bg-green-500 hover:bg-green-400 text-black text-xl font-black py-4 rounded-2xl"
            >
              ✅ ATENDER AGORA
            </button>
<button
  type="button"
  onClick={naoPossoAtender}
  className="w-full mt-3 rounded-2xl bg-blue-600 py-4 text-lg font-black text-white transition-all hover:bg-blue-500 active:scale-95"
>
  🔵 NÃO POSSO ATENDER
</button>
            <div className="mt-4 bg-slate-800 border border-yellow-500/40 rounded-2xl p-3">
              <p className="text-yellow-300 text-sm font-bold">
                Ouça o áudio e veja a câmera. Para responder, clique em ATENDER AGORA.
              </p>
            </div>
           
                      </div>
        </div>
      )}

      {popupAudioMoradorAberto && (
        <div className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-3xl p-5 shadow-2xl">

            {!gravandoAudioMorador && !enviandoAudioMorador && (
              <button
                type="button"
                onClick={() => {
                  setAudioRespostaBlob(null);
                  setPopupAudioMoradorAberto(false);
                }}
                className="absolute top-3 right-4 text-slate-400 hover:text-white text-3xl font-black"
              >
                ×
              </button>
            )}

            <div className="text-center mb-5">
              <div className="text-5xl mb-3">
                {gravandoAudioMorador ? "🎙️" : "🎧"}
              </div>

              <h2 className="text-2xl font-black">
                {gravandoAudioMorador
                  ? "GRAVANDO ÁUDIO"
                  : "ÁUDIO GRAVADO"}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {gravandoAudioMorador
                  ? "Fale normalmente e toque em parar quando terminar."
                  : "Confira o áudio antes de enviar ao visitante."}
              </p>
            </div>

            {gravandoAudioMorador && (
              <div className="space-y-4">

                <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 text-center">
                  <p className="text-red-400 font-black animate-pulse">
                    GRAVAÇÃO EM ANDAMENTO
                  </p>
                </div>

                <button
                  type="button"
                  onClick={pararGravacaoMorador}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl"
                >
                  ⏹️ PARAR GRAVAÇÃO
                </button>

              </div>
            )}

            {!gravandoAudioMorador && audioRespostaBlob && (
              <div className="space-y-4">

                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3">
                  <audio
                    controls
                    className="w-full"
                    src={URL.createObjectURL(audioRespostaBlob)}
                  />
                </div>

                <button
                  type="button"
                  onClick={enviarAudioMorador}
                  disabled={enviandoAudioMorador}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xl font-black py-4 rounded-2xl"
                >
                  {enviandoAudioMorador
                    ? "Enviando..."
                    : "📤 ENVIAR ÁUDIO"}
                </button>

                {!enviandoAudioMorador && (
                  <button
                    type="button"
                    onClick={() => {
                      setAudioRespostaBlob(null);
                      iniciarGravacaoMorador();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-2xl"
                  >
                    🔄 GRAVAR NOVAMENTE
                  </button>
                )}

              </div>
            )}

            {!gravandoAudioMorador && !audioRespostaBlob && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center text-slate-300 font-bold">
                Preparando microfone...
              </div>
            )}

          </div>
        </div>
      )}

      {audioPopup && (

        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-4 border-blue-400 rounded-3xl p-5 text-center shadow-2xl">
            <p className="text-6xl mb-3">🎙️</p>
            <h2 className="text-2xl font-black text-blue-300 mb-4">
              {audioPopup.titulo}
            </h2>

            <div className="bg-slate-800 rounded-2xl p-4 border border-blue-500/40">
              <audio
                controls
                className="w-full"
                src={audioPopup.audio}
                onPointerDown={silenciarToqueAoOuvirAudio}
                onTouchStart={silenciarToqueAoOuvirAudio}
                onClick={silenciarToqueAoOuvirAudio}
                onPlay={async () => {
                  silenciarToqueAoOuvirAudio();

                  if (
                    audioPopup.autor === "visitante" &&
                    audioPopup.mensagemId
                  ) {
                    const agora = Date.now();

                    await update(
                      ref(
                        db,
                        `${caminhoFirebase}/mensagens/${audioPopup.mensagemId}`
                      ),
                      {
                        visualizadoPeloMorador: true,
                        visualizadoPeloMoradorEm: agora,
                        audioOuvidoPeloMorador: true,
                        audioOuvidoPeloMoradorEm: agora,
                      }
                    );
                  }
                }}
                onPlaying={silenciarToqueAoOuvirAudio}
              />
            </div>

            <button
              onClick={() => {
                silenciarToqueAoOuvirAudio();
                setAudioPopup(null);
              }}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}

      {mostrarCameraGrande && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border-4 border-green-400 rounded-3xl p-5 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-green-400 mb-4">
              📷 Câmera do portão
            </h2>

            {fotoCameraAtual ? (
              <img
                src={`${fotoCameraAtual}?t=${fotoCameraAtualizadaEm}`}
                alt="Câmera do portão"
                className="w-full rounded-2xl border border-slate-600"
              />
            ) : (
              <p className="text-slate-400 text-sm bg-slate-800 rounded-2xl p-6">
                Nenhuma foto capturada ainda.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={capturarFotoCamera}
                disabled={capturandoCamera}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-500 text-white text-sm font-bold py-3 rounded-2xl"
              >
                {capturandoCamera ? "📸 Atualizando" : "📸 Atualizar"}
              </button>

              <button
                onClick={() => setMostrarCameraGrande(false)}
                className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-3 rounded-2xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarHistorico && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border-4 border-slate-600 rounded-3xl p-5 shadow-2xl my-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-2xl font-black">📋 Histórico</h3>

              <button
                onClick={() => setMostrarHistorico(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
              >
                FECHAR
              </button>
            </div>

            <button
              onClick={limparHistorico}
              className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-3 rounded-2xl mb-4"
            >
              LIMPAR HISTÓRICO
            </button>

            {historicoLista.length > 0 ? (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {historicoLista.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3"
                  >
                    <p className="text-green-400 text-sm font-bold">
                      {item.nome} - {item.motivo}
                    </p>

                    {item.fotoCamera && (
                      <img
                        src={item.fotoCamera}
                        alt="Snapshot da câmera"
                        className="w-full mt-3 rounded-xl border border-slate-600"
                      />
                    )}

                    <p className="text-slate-400 text-xs mt-3">
                      Finalizado em: {item.finalizadoEmFormatado}
                    </p>

                    <p className="text-blue-300 text-xs mt-1">
                      Tipo: {item.tipoFinalizacao || "Não informado"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-400 text-sm bg-slate-800 rounded-2xl p-4">
                🔔 Nenhum atendimento finalizado
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">
              🏠 {nomeLocal}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {ehResidencia
                ? "Casa Principal"
                : `Unidade: ${slug}`}
            </p>
          </div>

          <button
            type="button"
            onClick={alterarStatusOnline}
            title="Alterar disponibilidade para receber chamadas"
            className={
              online
                ? "bg-green-500/10 hover:bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold px-3 py-2 rounded-xl transition"
                : "bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-2 rounded-xl transition"
            }
          >
            {online ? "🟢 Disponível" : "🔴 Ausente"}
          </button>
        </div>

        {comunicados.length > 0 && (
          <div className="mt-5 rounded-2xl border border-blue-500/50 bg-blue-950/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-blue-300">
                  📢 COMUNICADOS
                </p>

                <h2 className="mt-1 text-lg font-black text-white">
                  {comunicados.filter(
                    (item) =>
                      item.visualizacoes?.[slug]?.ciente !== true
                  ).length > 0
                    ? `${comunicados.filter(
                        (item) =>
                          item.visualizacoes?.[slug]?.ciente !== true
                      ).length} comunicado(s) aguardando sua ciência`
                    : ehResidencia
                    ? "Avisos da residência"
                    : "Comunicados do condomínio"}
                </h2>
              </div>

              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                {comunicados.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {comunicados.slice(0, 3).map((comunicado) => {
                const ciente =
                  comunicado.visualizacoes?.[slug]?.ciente === true;

                return (
                  <button
                    key={comunicado.id}
                    type="button"
                    onClick={() => abrirComunicado(comunicado)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-900 p-3 text-left transition-all hover:bg-slate-800 active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {comunicado.tipo === "assembleia"
                          ? "👥"
                          : comunicado.tipo === "manutencao"
                          ? "🛠️"
                          : comunicado.tipo === "emergencia"
                          ? "🚨"
                          : "📢"}{" "}
                        {comunicado.titulo}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {comunicado.mensagem}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${
                        ciente
                          ? "bg-green-950 text-green-300"
                          : "bg-orange-950 text-orange-300"
                      }`}
                    >
                      {ciente ? "CIENTE" : "LER"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={tocarBip}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded-2xl"
          >
            🔊 Testar Som
          </button>

          <button
            onClick={ativarNotificacoes}
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold py-3 rounded-2xl"
          >
            🔔 Notificações
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            type="button"
            onClick={() => {
              if (!cameraContratada) {
                alert(
                  "📷 Recurso opcional\n\nA câmera é um recurso opcional do QR Acesso. Consulte a administração para ativação."
                );
                return;
              }

              abrirCameraGrande();
            }}
            disabled={cameraContratada && capturandoCamera}
            className={
              cameraContratada
                ? "bg-slate-700 hover:bg-slate-600 disabled:bg-gray-500 text-white text-sm font-bold py-3 rounded-2xl"
                : "bg-slate-800 border border-slate-600 text-slate-300 text-sm font-bold py-3 rounded-2xl"
            }
          >
            {cameraContratada
              ? capturandoCamera
                ? "📸 Atualizando"
                : "📷 Câmera"
              : "🔒 Câmera"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!portaoContratado) {
                alert(
                  "🚪 Recurso opcional\n\nA abertura de portão é um recurso opcional do QR Acesso. Consulte a administração para ativação."
                );
                return;
              }

              acionarPortao();
            }}
            disabled={portaoContratado && abrindoPortao}
            className={
              portaoContratado
                ? "bg-purple-600 hover:bg-purple-500 disabled:bg-gray-500 text-white text-sm font-bold py-3 rounded-2xl"
                : "bg-slate-800 border border-slate-600 text-slate-300 text-sm font-bold py-3 rounded-2xl"
            }
          >
            {portaoContratado
              ? abrindoPortao
                ? "⏳ Abrindo"
                : "🚪 Abrir portão"
              : "🔒 Abrir portão"}
          </button>
        </div>

        {statusPortao && (
          <p className="mt-3 text-center text-green-400 font-bold">
            {statusPortao}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={instalarApp}
            className={
              appInstalavel
                ? "bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-3 rounded-2xl"
                : "bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-3 rounded-2xl"
            }
          >
            📲 Instalar app
          </button>


        </div>

        <div className="bg-slate-800 rounded-2xl p-4 mt-4 border border-green-500/20">
          <h2 className="font-black text-green-400 text-xl">🔔 {nome}</h2>

          {nome.trim().toLowerCase() !== motivo.trim().toLowerCase() && (
            <p className="text-sm text-slate-300 mt-3">
              Motivo: {motivo}
            </p>
          )}









          {aguardandoAtendimento && (
            <button
              onClick={atenderSolicitacao}
              className="w-full mt-4 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-2xl"
            >
              ✅ ATENDER
            </button>
          )}

          {atendimentoEmAndamento ? (
            <>
              {respostasRapidasAbertas ? (
                <div className="mt-4 bg-slate-900 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold text-blue-300">
                      💬 Respostas rápidas
                    </h3>

                    <button
                      type="button"
                      onClick={() => setRespostasRapidasAbertas(false)}
                      className="text-xs font-bold text-slate-400 hover:text-white"
                    >
                      RECOLHER
                    </button>
                  </div>

                  {respostasRapidas.map((item) => (
                    <button
                      key={item.texto}
                      onClick={() => enviarMensagemRapida(item.mensagem)}
                      className="w-full mb-2 last:mb-0 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl"
                    >
                      {item.icone} {item.texto}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRespostasRapidasAbertas(true)}
                  className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-blue-500/40 text-blue-300 font-black py-3 rounded-2xl"
                >
                  💬 RESPOSTAS RÁPIDAS
                </button>
              )}

              {mensagensConversa.length > 0 && (
                <div className="mt-4 bg-slate-900 border border-blue-500/40 rounded-2xl p-4">
                  <h3 className="font-bold text-blue-300 mb-3">
                    💬 Conversa do atendimento
                  </h3>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
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
                          <button
                            type="button"
                            onClick={async () => {
                              if (item.autor === "visitante") {
                                silenciarToqueAoOuvirAudio();

                                if (item.id) {
                                  const agora = Date.now();

                                  await update(
                                    ref(
                                      db,
                                      `${caminhoFirebase}/mensagens/${item.id}`
                                    ),
                                    {
                                      visualizadoPeloMorador: true,
                                      visualizadoPeloMoradorEm: agora,
                                      audioOuvidoPeloMorador: true,
                                      audioOuvidoPeloMoradorEm: agora,
                                    }
                                  );
                                }
                              }

                              setAudioPopup({
                                titulo:
                                  item.autor === "morador"
                                    ? "🎙️ Seu áudio enviado"
                                    : "🎙️ Áudio do visitante",
                                audio: item.audioBase64 || "",
                              });
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl py-3 font-bold text-white"
                          >
                            🎙️ Ouvir áudio
                          </button>
                        )}

                        {item.autor === "morador" &&
                          item.id === ultimaMensagemMoradorId && (
                            <p
                              className={
                                visitanteVisualizou
                                  ? "text-xs text-green-400 font-bold mt-2 text-right"
                                  : "text-xs text-slate-400 font-bold mt-2 text-right"
                              }
                            >
                              {visitanteVisualizou
                                ? "✓✓ Lido"
                                : "✓ Enviado"}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPopupAudioMoradorAberto(true);
                    iniciarGravacaoMorador();
                  }}
                  disabled={enviandoAudioMorador}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 py-3 rounded-xl font-black"
                >
                  🎙️ GRAVAR ÁUDIO
                </button>
              </div>
            </>
          ) : null}

          {chamadaAtiva &&
            !gravandoAudioMorador &&
            !audioRespostaBlob &&
            !enviandoAudioMorador && (
              <button
                onClick={finalizarSolicitacao}
                className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl"
              >
                ❌ FINALIZAR ATENDIMENTO
              </button>
            )}
        </div>

      </div>
    </main>
  );
}






















