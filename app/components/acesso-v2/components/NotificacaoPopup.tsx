"use client";

type PopupMensagemProps = {
  popupTexto: string;
  popupTipo?: "mensagem" | "encerrado" | "audio";
  audioBase64?: string;
  onFechar: () => void | Promise<void>;
};

export default function PopupMensagem({
  popupTexto,
  popupTipo = "mensagem",
  audioBase64 = "",
  onFechar,
}: PopupMensagemProps) {
  if (!popupTexto && !audioBase64) return null;

  const ehAudio = popupTipo === "audio" && audioBase64;
  const ehEncerrado = popupTipo === "encerrado";

  const titulo = ehAudio
    ? popupTexto || "Novo áudio recebido"
    : ehEncerrado
    ? "Atendimento encerrado"
    : "Nova mensagem";

  const icone = ehAudio ? "🎙️" : ehEncerrado ? "✅" : "💬";

  const corBorda = ehAudio
    ? "border-blue-400"
    : ehEncerrado
    ? "border-green-400"
    : "border-cyan-400";

  const corTitulo = ehAudio
    ? "text-blue-200"
    : ehEncerrado
    ? "text-green-300"
    : "text-cyan-200";

  const corBotao = ehAudio
    ? "bg-blue-600 hover:bg-blue-500"
    : ehEncerrado
    ? "bg-green-600 hover:bg-green-500"
    : "bg-cyan-600 hover:bg-cyan-500";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md bg-slate-900 ${corBorda} border-2 rounded-3xl p-5 text-center shadow-2xl`}
      >
        <div className="text-6xl mb-3 animate-pulse">{icone}</div>

        <h2 className={`text-2xl font-black mb-4 ${corTitulo}`}>{titulo}</h2>

        {ehAudio ? (
          <div className="bg-slate-800 rounded-2xl p-4 border border-blue-500/40">
            <audio controls autoPlay className="w-full" src={audioBase64} />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-600">
            <p className="text-white text-lg font-bold">{popupTexto}</p>
          </div>
        )}

        <button
          onClick={onFechar}
          className={`w-full mt-5 ${corBotao} text-white font-black py-4 rounded-2xl`}
        >
          ENTENDI
        </button>
      </div>
    </div>
  );
}
