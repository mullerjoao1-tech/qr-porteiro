"use client";

import type { ReactNode } from "react";

type DashboardSectionProps = {
  etiqueta: string;
  titulo: string;
  descricao?: string;
  corEtiqueta?: string;
  children: ReactNode;
};

export default function DashboardSection({
  etiqueta,
  titulo,
  descricao,
  corEtiqueta = "text-cyan-400",
  children,
}: DashboardSectionProps) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
      <div>
        <p
          className={[
            "text-xs font-black uppercase tracking-[0.2em]",
            corEtiqueta,
          ].join(" ")}
        >
          {etiqueta}
        </p>

        <h2 className="mt-2 text-2xl font-black">
          {titulo}
        </h2>

        {descricao && (
          <p className="mt-2 text-sm text-slate-400">
            {descricao}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}
