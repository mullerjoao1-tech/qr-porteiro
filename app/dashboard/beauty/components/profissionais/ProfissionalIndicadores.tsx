"use client";

interface ProfissionalIndicadoresProps {
  total: number;
  ativos: number;
  inativos: number;
  especialidades: number;
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-black text-white">
        {valor}
      </p>
    </div>
  );
}

export default function ProfissionalIndicadores({
  total,
  ativos,
  inativos,
  especialidades,
}: ProfissionalIndicadoresProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card titulo="Profissionais" valor={total} />
      <Card titulo="Ativos" valor={ativos} />
      <Card titulo="Inativos" valor={inativos} />
      <Card titulo="Especialidades" valor={especialidades} />
    </section>
  );
}
