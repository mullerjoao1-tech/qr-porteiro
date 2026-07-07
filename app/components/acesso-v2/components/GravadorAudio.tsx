"use client";

type Props = {
  gravando: boolean;
  enviando: boolean;
  audioBlob: Blob | null;

  onGravar: () => void;
  onParar: () => void;
  onEnviar: () => void;
};

export default function GravadorAudio({
  gravando,
  enviando,
  audioBlob,
  onGravar,
  onParar,
  onEnviar,
}: Props) {
  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={gravando ? onParar : onGravar}
        disabled={enviando}
        className={
          gravando
            ? "w-full bg-red-600 text-white text-xl font-black py-4 rounded-2xl animate-pulse"
            : "w-full bg-blue-600 text-white text-xl font-black py-4 rounded-2xl disabled:bg-gray-500"
        }
      >
        {gravando
          ? "⏹️ PARAR GRAVAÇÃO"
          : "🎙️ GRAVAR ÁUDIO"}
      </button>

      {audioBlob && (
        <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 space-y-3">

          <audio
            controls
            className="w-full"
            src={URL.createObjectURL(audioBlob)}
          />

          <button
            onClick={onEnviar}
            disabled={enviando}
            className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-500 text-white text-xl font-black py-4 rounded-2xl"
          >
            {enviando
              ? "Enviando..."
              : "📤 ENVIAR ÁUDIO"}
          </button>
        </div>
      )}
    </div>
  );
}