"use client";

import type {
  CoreBadgeCor,
  CoreBadgeProps,
  CoreBadgeTamanho,
} from "./CoreBadgeTypes";

const classesPorCor: Record<
  CoreBadgeCor,
  {
    preenchido: string;
    contorno: string;
  }
> = {
  slate: {
    preenchido: "bg-slate-700 text-slate-100",
    contorno: "border-slate-600 text-slate-300",
  },
  blue: {
    preenchido: "bg-blue-500/20 text-blue-300",
    contorno: "border-blue-500/50 text-blue-300",
  },
  cyan: {
    preenchido: "bg-cyan-500/20 text-cyan-300",
    contorno: "border-cyan-500/50 text-cyan-300",
  },
  green: {
    preenchido: "bg-emerald-500/20 text-emerald-300",
    contorno: "border-emerald-500/50 text-emerald-300",
  },
  yellow: {
    preenchido: "bg-yellow-500/20 text-yellow-300",
    contorno: "border-yellow-500/50 text-yellow-300",
  },
  orange: {
    preenchido: "bg-orange-500/20 text-orange-300",
    contorno: "border-orange-500/50 text-orange-300",
  },
  red: {
    preenchido: "bg-red-500/20 text-red-300",
    contorno: "border-red-500/50 text-red-300",
  },
  pink: {
    preenchido: "bg-pink-500/20 text-pink-300",
    contorno: "border-pink-500/50 text-pink-300",
  },
  violet: {
    preenchido: "bg-violet-500/20 text-violet-300",
    contorno: "border-violet-500/50 text-violet-300",
  },
};

const classesPorTamanho: Record<CoreBadgeTamanho, string> = {
  sm: "px-2 py-1 text-[10px]",
  md: "px-3 py-1.5 text-xs",
  lg: "px-4 py-2 text-sm",
};

export default function CoreBadge({
  texto,
  cor = "slate",
  tamanho = "md",
  icone,
  pulsar = false,
  contorno = false,
}: CoreBadgeProps) {
  const classesCor = classesPorCor[cor];
  const classesTamanho = classesPorTamanho[tamanho];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full font-black uppercase tracking-[0.08em] ${
        contorno
          ? `border bg-transparent ${classesCor.contorno}`
          : classesCor.preenchido
      } ${classesTamanho} ${pulsar ? "animate-pulse" : ""}`}
    >
      {icone && <span aria-hidden="true">{icone}</span>}
      <span>{texto}</span>
    </span>
  );
}
