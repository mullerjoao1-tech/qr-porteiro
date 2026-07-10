"use client";

import Link from "next/link";

type HeaderCondominioProps = {
  nome?: string;
  cidade?: string;
  status?: string;
};

export default function HeaderCondominio({
  nome = "Residencial Tulipas",
  cidade = "Curitiba / PR",
  status = "🟢 Operação normal",
}: HeaderCondominioProps) {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              href="/lab/administradora"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            >
              ← Administradora
            </Link>

            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              🏢 Central do Condomínio
            </span>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {status}
            </span>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              🧪 LAB
            </span>
          </div>

          <h1 className="text-4xl font-black text-slate-950">
            {nome}
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            {cidade} • 32 unidades • Atualizado agora
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 md:min-w-[260px]">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Resumo rápido
          </p>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
            Portaria online, portão online e nenhum alerta crítico ativo neste
            momento.
          </p>
        </div>
      </div>
    </header>
  );
}