"use client";

import type {
  MetricCardColor,
  MetricCardProps,
} from "./MetricCardTypes";

const classesPorCor: Record<
  MetricCardColor,
  {
    borda: string;
    fundo: string;
    titulo: string;
    icone: string;
    hover: string;
  }
> = {
  pink: {
    borda: "border-pink-800",
    fundo: "bg-pink-950/25",
    titulo: "text-pink-300",
    icone: "bg-pink-500/15 text-pink-300",
    hover: "hover:border-pink-500 hover:bg-pink-950/40",
  },
  blue: {
    borda: "border-blue-800",
    fundo: "bg-blue-950/25",
    titulo: "text-blue-300",
    icone: "bg-blue-500/15 text-blue-300",
    hover: "hover:border-blue-500 hover:bg-blue-950/40",
  },
  green: {
    borda: "border-emerald-800",
    fundo: "bg-emerald-950/25",
    titulo: "text-emerald-300",
    icone: "bg-emerald-500/15 text-emerald-300",
    hover: "hover:border-emerald-500 hover:bg-emerald-950/40",
  },
  orange: {
    borda: "border-orange-800",
    fundo: "bg-orange-950/25",
    titulo: "text-orange-300",
    icone: "bg-orange-500/15 text-orange-300",
    hover: "hover:border-orange-500 hover:bg-orange-950/40",
  },
  violet: {
    borda: "border-violet-800",
    fundo: "bg-violet-950/25",
    titulo: "text-violet-300",
    icone: "bg-violet-500/15 text-violet-300",
    hover: "hover:border-violet-500 hover:bg-violet-950/40",
  },
  cyan: {
    borda: "border-cyan-800",
    fundo: "bg-cyan-950/25",
    titulo: "text-cyan-300",
    icone: "bg-cyan-500/15 text-cyan-300",
    hover: "hover:border-cyan-500 hover:bg-cyan-950/40",
  },
  red: {
    borda: "border-red-800",
    fundo: "bg-red-950/25",
    titulo: "text-red-300",
    icone: "bg-red-500/15 text-red-300",
    hover: "hover:border-red-500 hover:bg-red-950/40",
  },
  slate: {
    borda: "border-slate-700",
    fundo: "bg-slate-900",
    titulo: "text-slate-300",
    icone: "bg-slate-800 text-slate-300",
    hover: "hover:border-slate-500 hover:bg-slate-800",
  },
};

export default function MetricCard({
  titulo,
  valor,
  detalhe,
  icone,
  cor = "slate",
  onClick,
}: MetricCardProps) {
  const classes = classesPorCor[cor];
  const clicavel = typeof onClick === "function";

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.08em] ${classes.titulo}`}
          >
            {titulo}
          </p>

          <p className="mt-2 break-words text-3xl font-black text-white">
            {valor}
          </p>
        </div>

        {icone && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${classes.icone}`}
          >
            {icone}
          </div>
        )}
      </div>

      {detalhe && (
        <p className="mt-2 text-xs font-bold text-slate-400">
          {detalhe}
        </p>
      )}
    </>
  );

  const className = `w-full rounded-2xl border p-4 text-left transition-all duration-200 ${classes.borda} ${classes.fundo} ${classes.hover} ${
    clicavel
      ? "cursor-pointer active:scale-[0.98]"
      : "cursor-default"
  }`;

  if (clicavel) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
      >
        {conteudo}
      </button>
    );
  }

  return <div className={className}>{conteudo}</div>;
}
