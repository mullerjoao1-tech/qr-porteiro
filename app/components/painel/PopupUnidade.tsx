import type { UnidadePainel } from "./CardUnidade";

type Props = {
  unidade: UnidadePainel | null;
  aoFechar: () => void;
  aoAtender: (unidade: UnidadePainel) => void;
  aoEnviarMensagem: (
    unidade: UnidadePainel,
    mensagem: string
  ) => void;
  aoFinalizar: (unidade: UnidadePainel) => void;
  aoCriarTeste: (
    unidade: UnidadePainel,
    motivo: string
  ) => void;
};

export default function PopupUnidade({
  unidade,
  aoFechar,
  aoAtender,
  aoEnviarMensagem,
  aoFinalizar,
  aoCriarTeste,
}: Props) {
  if (!unidade) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black">
              🏠 {unidade.nome}
            </h2>

            <p className="text-slate-400">
              {unidade.tipo || "Unidade"}
            </p>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            className="bg-red-600 px-4 py-2 rounded-xl font-bold"
          >
            Fechar
          </button>
        </div>

        {unidade.chamada ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => aoAtender(unidade)}
              className="w-full bg-green-500 py-4 rounded-xl font-black text-black"
            >
              ✅ Atender
            </button>

            <button
              type="button"
              onClick={() =>
                aoEnviarMensagem(
                  unidade,
                  "Aguarde um momento, por favor."
                )
              }
              className="w-full bg-blue-600 py-4 rounded-xl font-bold"
            >
              💬 Aguarde um momento
            </button>

            <button
              type="button"
              onClick={() => aoFinalizar(unidade)}
              className="w-full bg-red-600 py-4 rounded-xl font-black"
            >
              ❌ Finalizar
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() =>
                aoCriarTeste(unidade, "Visitante")
              }
              className="w-full bg-slate-700 py-4 rounded-xl font-bold"
            >
              Criar teste: Visitante
            </button>

            <button
              type="button"
              onClick={() =>
                aoCriarTeste(unidade, "Entrega")
              }
              className="w-full bg-blue-700 py-4 rounded-xl font-bold"
            >
              Criar teste: Entrega
            </button>

            <button
              type="button"
              onClick={() =>
                aoCriarTeste(
                  unidade,
                  "Entrega de comida"
                )
              }
              className="w-full bg-orange-600 py-4 rounded-xl font-bold"
            >
              Criar teste: 🍔 Comida
            </button>
          </div>
        )}
      </div>
    </div>
  );
}