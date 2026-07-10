type Props = {
  popupTexto: string;
  popupTipo: "mensagem" | "encerrado" | "audio";
  audioBase64?: string;
  onFechar: () => void;
};

export default function PopupMensagem({
  popupTexto,
  popupTipo,
  audioBase64,
  onFechar,
}: Props) {
  if (!popupTexto) return null;

  const ehEncerrado = popupTipo === "encerrado";
  const ehAudio = popupTipo === "audio";

  function ouvirAudio() {
    if (!audioBase64) return;

    const audio = new Audio(audioBase64);
    audio.play();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5">
      <div
        className={
          ehEncerrado
            ? "w-full max-w-xl bg-green-600 border-4 border-green-300 rounded-3xl p-8 text-center shadow-2xl"
            : "w-full max-w-xl bg-blue-600 border-4 border-blue-300 rounded-3xl p-8 text-center shadow-2xl"
        }
      >
        <p className="text-5xl mb-4">
          {ehEncerrado ? "✅" : ehAudio ? "🎤" : "💬"}
        </p>

        <h2 className="text-2xl font-black mb-3">
          {ehEncerrado
            ? "ATENDIMENTO ENCERRADO"
            : ehAudio
            ? "NOVO ÁUDIO"
            : "NOVA MENSAGEM"}
        </h2>

        <p className="text-3xl font-black leading-relaxed py-6">
          {popupTexto}
        </p>

        {ehAudio && (
          <button
            onClick={ouvirAudio}
            className="mb-4 w-full bg-slate-900 text-white text-xl font-black py-5 rounded-2xl"
          >
            ▶ OUVIR ÁUDIO
          </button>
        )}

        <button
          onClick={onFechar}
          className="w-full bg-white text-black text-2xl font-black py-5 rounded-2xl"
        >
          ENTENDI
        </button>
      </div>
    </div>
  );
}