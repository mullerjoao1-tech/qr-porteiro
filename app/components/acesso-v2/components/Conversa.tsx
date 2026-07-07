type Mensagem = {
  id?: string;
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
};

type Props = {
  mensagens: Mensagem[];
};

export default function Conversa({ mensagens }: Props) {
  return (
    <div className="bg-slate-800 border border-blue-500/40 rounded-2xl p-4 mb-5">
      <p className="text-blue-300 font-black mb-3">
        💬 Conversa do atendimento
      </p>

      {mensagens.length === 0 ? (
        <p className="text-sm text-slate-400">
          A conversa ainda não possui mensagens.
        </p>
      ) : (
        <div className="space-y-3">
          {mensagens.map((item) => (
            <div
              key={item.id}
              className={
                item.autor === "visitante"
                  ? "bg-blue-600/30 border border-blue-500 rounded-2xl p-3"
                  : "bg-green-600/30 border border-green-500 rounded-2xl p-3"
              }
            >
              <p className="text-xs font-black mb-2">
                {item.autor === "visitante" ? "Você" : "Morador"}
              </p>

              {item.tipo === "texto" && (
                <p className="text-white font-bold">
                  {item.texto}
                </p>
              )}

              {item.tipo === "audio" && item.audioBase64 && (
                <audio
                  controls
                  className="w-full"
                  src={item.audioBase64}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}