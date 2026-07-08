"use client";

import { useEffect } from "react";

type TipoNotificacao =
  | "mensagem"
  | "encerrado"
  | "audio"
  | "alerta"
  | "sucesso"
  | "erro"
  | "entrega"
  | "agenda"
  | "comunicado"
  | "portao"
  | "camera"
  | "sistema";

type NotificacaoPopupProps = {
  popupTexto: string;
  popupTipo?: TipoNotificacao;
  audioBase64?: string;
  onFechar: () => void | Promise<void>;
  onAbrir?: () => void | Promise<void>;
  onAudioPlay?: () => void | Promise<void>;
  tituloPersonalizado?: string;
  botaoTexto?: string;
};

const CONFIG_NOTIFICACAO: Record<
  TipoNotificacao,
  {
    titulo: string;
    icone: string;
    corBorda: string;
    corTitulo: string;
    corBotao: string;
    bordaConteudo: string;
  }
> = {
  mensagem: {
    titulo: "Nova mensagem",
    icone: "💬",
    corBorda: "border-cyan-400",
    corTitulo: "text-cyan-200",
    corBotao: "bg-cyan-600 hover:bg-cyan-500",
    bordaConteudo: "border-cyan-500/40",
  },
  encerrado: {
    titulo: "Atendimento encerrado",
    icone: "✅",
    corBorda: "border-green-400",
    corTitulo: "text-green-300",
    corBotao: "bg-green-600 hover:bg-green-500",
    bordaConteudo: "border-green-500/40",
  },
  audio: {
    titulo: "Novo áudio recebido",
    icone: "🎙️",
    corBorda: "border-blue-400",
    corTitulo: "text-blue-200",
    corBotao: "bg-blue-600 hover:bg-blue-500",
    bordaConteudo: "border-blue-500/40",
  },
  alerta: {
    titulo: "Alerta importante",
    icone: "🚨",
    corBorda: "border-red-400",
    corTitulo: "text-red-300",
    corBotao: "bg-red-600 hover:bg-red-500",
    bordaConteudo: "border-red-500/40",
  },
  sucesso: {
    titulo: "Tudo certo",
    icone: "✅",
    corBorda: "border-green-400",
    corTitulo: "text-green-300",
    corBotao: "bg-green-600 hover:bg-green-500",
    bordaConteudo: "border-green-500/40",
  },
  erro: {
    titulo: "Atenção",
    icone: "⚠️",
    corBorda: "border-red-400",
    corTitulo: "text-red-300",
    corBotao: "bg-red-600 hover:bg-red-500",
    bordaConteudo: "border-red-500/40",
  },
  entrega: {
    titulo: "Nova entrega",
    icone: "📦",
    corBorda: "border-yellow-400",
    corTitulo: "text-yellow-300",
    corBotao: "bg-yellow-500 hover:bg-yellow-400 text-black",
    bordaConteudo: "border-yellow-500/40",
  },
  agenda: {
    titulo: "Compromisso na agenda",
    icone: "📅",
    corBorda: "border-purple-400",
    corTitulo: "text-purple-300",
    corBotao: "bg-purple-600 hover:bg-purple-500",
    bordaConteudo: "border-purple-500/40",
  },
  comunicado: {
    titulo: "Comunicado",
    icone: "📢",
    corBorda: "border-orange-400",
    corTitulo: "text-orange-300",
    corBotao: "bg-orange-600 hover:bg-orange-500",
    bordaConteudo: "border-orange-500/40",
  },
  portao: {
    titulo: "Portão",
    icone: "🚪",
    corBorda: "border-emerald-400",
    corTitulo: "text-emerald-300",
    corBotao: "bg-emerald-600 hover:bg-emerald-500",
    bordaConteudo: "border-emerald-500/40",
  },
  camera: {
    titulo: "Câmera",
    icone: "📷",
    corBorda: "border-sky-400",
    corTitulo: "text-sky-300",
    corBotao: "bg-sky-600 hover:bg-sky-500",
    bordaConteudo: "border-sky-500/40",
  },
  sistema: {
    titulo: "Notificação do sistema",
    icone: "🔔",
    corBorda: "border-slate-400",
    corTitulo: "text-slate-200",
    corBotao: "bg-slate-600 hover:bg-slate-500",
    bordaConteudo: "border-slate-500/40",
  },
};

export default function NotificacaoPopup({
  popupTexto,
  popupTipo = "mensagem",
  audioBase64 = "",
  onFechar,
  onAbrir,
  onAudioPlay,
  tituloPersonalizado = "",
  botaoTexto = "ENTENDI",
}: NotificacaoPopupProps) {
  const ehAudio = popupTipo === "audio" && Boolean(audioBase64);

  useEffect(() => {
    if (!popupTexto && !audioBase64) return;

    async function executarAbertura() {
      try {
        if (onAbrir) await onAbrir();

        if (ehAudio && onAudioPlay) {
          await onAudioPlay();
        }
      } catch (erro) {
        console.error("Erro ao abrir notificação:", erro);
      }
    }

    executarAbertura();
  }, [popupTexto, audioBase64, ehAudio, onAbrir, onAudioPlay]);

  if (!popupTexto && !audioBase64) return null;

  const config = CONFIG_NOTIFICACAO[popupTipo] || CONFIG_NOTIFICACAO.sistema;

  const titulo = tituloPersonalizado || popupTexto || config.titulo;

  async function fecharPopup() {
    try {
      if (ehAudio && onAudioPlay) {
        await onAudioPlay();
      }

      await onFechar();
    } catch (erro) {
      console.error("Erro ao fechar notificação:", erro);
    }
  }

  async function tratarAudioPlay() {
    try {
      if (onAudioPlay) await onAudioPlay();
    } catch (erro) {
      console.error("Erro ao reproduzir áudio:", erro);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md bg-slate-900 ${config.corBorda} border-2 rounded-3xl p-5 text-center shadow-2xl`}
      >
        <div className="text-6xl mb-3 animate-pulse">{config.icone}</div>

        <h2 className={`text-2xl font-black mb-4 ${config.corTitulo}`}>
          {titulo}
        </h2>

        {ehAudio ? (
          <div
            className={`bg-slate-800 rounded-2xl p-4 border ${config.bordaConteudo}`}
          >
            <audio
              controls
              autoPlay
              className="w-full"
              src={audioBase64}
              onLoadedMetadata={tratarAudioPlay}
              onCanPlay={tratarAudioPlay}
              onPlay={tratarAudioPlay}
              onPlaying={tratarAudioPlay}
            />
          </div>
        ) : (
          <div
            className={`bg-slate-800 rounded-2xl p-4 border ${config.bordaConteudo}`}
          >
            <p className="text-white text-lg font-bold">{popupTexto}</p>
          </div>
        )}

        <button
          onClick={fecharPopup}
          className={`w-full mt-5 ${config.corBotao} font-black py-4 rounded-2xl`}
        >
          {botaoTexto}
        </button>
      </div>
    </div>
  );
}
