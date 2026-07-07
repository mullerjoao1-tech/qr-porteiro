type Props = {
  popupTexto: string;
  popupTipo: "mensagem" | "encerrado";
  onFechar: () => void;
};

export default function PopupMensagem({
  popupTexto,
  popupTipo,
  onFechar,
}: Props) {
  if (!popupTexto) return null;

  return (
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
          onClick={onFechar}
          className="mt-7 w-full bg-white text-black text-2xl font-black py-5 rounded-2xl"
        >
          ENTENDI
        </button>
      </div>
    </div>
  );
}