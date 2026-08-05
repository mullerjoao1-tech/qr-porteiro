"use client";

import Link from "next/link";

import DashboardSection from "@/app/components/core/dashboard/DashboardSection";

export type AtalhoDashboard = {
  id: string;
  titulo: string;
  descricao: string;
  rota: string;
  icone: string;
};

type DashboardAtalhosProps = {
  etiqueta: string;
  titulo: string;
  descricao: string;
  atalhos: AtalhoDashboard[];
};

export default function DashboardAtalhos({
  etiqueta,
  titulo,
  descricao,
  atalhos,
}: DashboardAtalhosProps) {
  return (
    <DashboardSection
      etiqueta={etiqueta}
      titulo={titulo}
      descricao={descricao}
      corEtiqueta="text-cyan-400"
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {atalhos.map((atalho) => (
          <Link
            key={atalho.id}
            href={atalho.rota}
            className="group rounded-3xl border border-slate-700 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-cyan-500 hover:bg-slate-800"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-3xl">
              {atalho.icone}
            </div>

            <h3 className="mt-5 text-xl font-black">
              {atalho.titulo}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {atalho.descricao}
            </p>

            <div className="mt-5 flex items-center justify-between text-sm font-black text-cyan-300">
              <span>Abrir módulo</span>

              <span className="transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </DashboardSection>
  );
}
