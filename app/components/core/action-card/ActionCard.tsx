"use client";

import { useQRTheme } from "../provider";
import type { ActionCardColor, ActionCardProps } from "./ActionCardTypes";

const classesPorCor: Record<
  ActionCardColor,
  {
    borda: string;
    fundo: string;
    icone: string;
    titulo: string;
    destaque: string;
    hover: string;
  }
> = {
  pink: {
    borda: "border-pink-800",
    fundo: "bg-pink-950/25",
    icone: "bg-pink-500/15 text-pink-300",
    titulo: "text-pink-300",
    destaque: "text-pink-200",
    hover: "hover:border-pink-500 hover:bg-pink-950/40",
  },
  blue: {
    borda: "border-blue-800",
    fundo: "bg-blue-950/25",
    icone: "bg-blue-500/15 text-blue-300",
    titulo: "text-blue-300",
    destaque: "text-blue-200",
    hover: "hover:border-blue-500 hover:bg-blue-950/40",
  },
  green: {
    borda: "border-emerald-800",
    fundo: "bg-emerald-950/25",
    icone: "bg-emerald-500/15 text-emerald-300",
    titulo: "text-emerald-300",
    destaque: "text-emerald-200",
    hover: "hover:border-emerald-500 hover:bg-emerald-950/40",
  },
  orange: {
    borda: "border-orange-800",
    fundo: "bg-orange-950/25",
    icone: "bg-orange-500/15 text-orange-300",
    titulo: "text-orange-300",
    destaque: "text-orange-200",
    hover: "hover:border-orange-500 hover:bg-orange-950/40",
  },
  violet: {
    borda: "border-violet-800",
    fundo: "bg-violet-950/25",
    icone: "bg-violet-500/15 text-violet-300",
    titulo: "text-violet-300",
    destaque: "text-violet-200",
    hover: "hover:border-violet-500 hover:bg-violet-950/40",
  },
  cyan: {
    borda: "border-cyan-800",
    fundo: "bg-cyan-950/25",
    icone: "bg-cyan-500/15 text-cyan-300",
    titulo: "text-cyan-300",
    destaque: "text-cyan-200",
    hover: "hover:border-cyan-500 hover:bg-cyan-950/40",
  },
  red: {
    borda: "border-red-800",
    fundo: "bg-red-950/25",
    icone: "bg-red-500/15 text-red-300",
    titulo: "text-red-300",
    destaque: "text-red-200",
    hover: "hover:border-red-500 hover:bg-red-950/40",
  },
};

function corPadraoDoSegmento(segmento: string): ActionCardColor {
  switch (segmento) {
    case "beauty":
      return "pink";
    case "condominio":
      return "cyan";
    case "barber":
      return "blue";
    case "food":
      return "orange";
    case "pet":
      return "green";
    case "health":
      return "red";
    default:
      return "violet";
  }
}

export default function ActionCard({
  titulo,
  descricao,
  icone,
  cor,
  badge,
  destaque,
  onClick,
  footer,
  children,
}: ActionCardProps) {
  const theme = useQRTheme();
  const corFinal = cor ?? corPadraoDoSegmento(theme.segmento);
  const classes = classesPorCor[corFinal];
  const clicavel = typeof onClick === "function";

  const conteudo = (
    <>
      {badge && (
        <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
          {badge}
        </span>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${classes.icone}`}
        >
          {icone ?? theme.icone}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={`text-lg font-black ${classes.titulo}`}>
            {titulo}
          </h3>

          {descricao && (
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {descricao}
            </p>
          )}

          {destaque && (
            <p className={`mt-3 text-xs font-black ${classes.destaque}`}>
              {destaque}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-4 text-sm text-slate-300">
          {children}
        </div>
      )}

      {footer && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {footer}
        </div>
      )}
    </>
  );

  const className = `relative w-full rounded-2xl border p-5 text-left transition-all duration-200 ${classes.borda} ${classes.fundo} ${classes.hover} ${
    clicavel ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
  }`;

  if (clicavel) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {conteudo}
      </button>
    );
  }

  return <div className={className}>{conteudo}</div>;
}
