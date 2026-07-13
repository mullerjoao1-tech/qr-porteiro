export type UnidadePainel = {
  id: string;
  nome: string;
  tipo?: string;
  chamada?: {
    nome?: string;
    motivo?: string;
    status?: string;
    criadoEm?: string;
    mensagemResponsavel?: string;
  };
};

type Props = {
  unidade: UnidadePainel;
  aoAbrir: (unidade: UnidadePainel) => void;
};

function corStatus(unidade: UnidadePainel) {
  if (unidade.chamada?.status === "Aguardando atendimento") {
    return "border-green-400 bg-green-500/10";
  }

  if (unidade.chamada?.status === "Em atendimento") {
    return "border-yellow-400 bg-yellow-500/10";
  }

  return "border-slate-700 bg-slate-900";
}

function indicadorStatus(unidade: UnidadePainel) {
  if (unidade.chamada?.status === "Aguardando atendimento") {
    return "🟢";
  }

  if (unidade.chamada?.status === "Em atendimento") {
    return "🟡";
  }

  return "⚪";
}

export default function CardUnidade({ unidade, aoAbrir }: Props) {
  return (
    <button
      type="button"
      onClick={() => aoAbrir(unidade)}
      className={`border-2 rounded-2xl p-4 text-left transition hover:scale-[1.02] ${corStatus(
        unidade
      )}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-black text-lg">🏠</span>

        <span className="text-xs font-bold">
          {indicadorStatus(unidade)}
        </span>
      </div>

      <h2 className="font-black text-sm md:text-base text-red-500">
        {unidade.nome}
      </h2>

      <p className="text-xs text-slate-400 mt-1">
        {unidade.tipo || "Unidade"}
      </p>
    </button>
  );
}