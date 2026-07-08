"use client";

import { ReactNode } from "react";

type Variante =
  | "primario"
  | "sucesso"
  | "perigo"
  | "aviso"
  | "info"
  | "neutro";

type BadgeProps = {
  children: ReactNode;
  variante?: Variante;
  icone?: string;
};

export default function Badge({
  children,
  variante = "primario",
  icone,
}: BadgeProps) {
  const cores: Record<Variante, string> = {
    primario: "bg-blue-500/15 border-blue-500/40 text-blue-300",
    sucesso: "bg-green-500/15 border-green-500/40 text-green-300",
    perigo: "bg-red-500/15 border-red-500/40 text-red-300",
    aviso: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
    info: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
    neutro: "bg-slate-700 border-slate-600 text-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black ${cores[variante]}`}
    >
      {icone && <span>{icone}</span>}
      <span>{children}</span>
    </span>
  );
}
