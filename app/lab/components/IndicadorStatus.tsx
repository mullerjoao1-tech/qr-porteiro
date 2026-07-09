"use client";

type NivelStatus = "ok" | "atencao" | "critico" | "neutro";

type IndicadorStatusProps = {
  titulo: string;
  descricao: string;
  status: NivelStatus;
};

export default function IndicadorStatus({
  titulo,
  descricao,
  status,
}: IndicadorStatusProps) {
  const config = {
    ok: {
      bolinha: "bg-emerald-500",
      texto: "Operando bem",
      caixa: "border-emerald-200 bg-emerald-50",
      titulo: "text-emerald-900",
      descricao: "text-emerald-700",
    },
    atencao: {
      bolinha: "bg-amber-500",
      texto: "Atenção",
      caixa: "border-amber-200 bg-amber-50",
      titulo: "text-amber-900",
      descricao: "text-amber-700",
    },
    critico: {
      bolinha: "bg-red-500",
      texto: "Crítico",
      caixa: "border-red-200 bg-red-50",
      titulo: "text-red-900",
      descricao: "text-red-700",
    },
    neutro: {
      bolinha: "bg-slate-400",
      texto: "Informativo",
      caixa: "border-slate-200 bg-slate-50",
      titulo: "text-slate-900",
      descricao: "text-slate-600",
    },
  };

  const atual = config[status];

  return (
    <div className={`rounded-2xl border p-4 ${atual.caixa}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-3 w-3 rounded-full ${atual.bolinha}`} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`font-semibold ${atual.titulo}`}>{titulo}</h4>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {atual.texto}
            </span>
          </div>

          <p className={`mt-1 text-sm leading-relaxed ${atual.descricao}`}>
            {descricao}
          </p>
        </div>
      </div>
    </div>
  );
}
