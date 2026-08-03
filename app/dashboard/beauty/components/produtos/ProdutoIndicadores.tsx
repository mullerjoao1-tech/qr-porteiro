"use client";

interface Props {
  total: number;
  ativos: number;
  inativos: number;
  estoqueBaixo: number;
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

      <p className="mt-2 text-4xl font-black text-white">
        {valor}
      </p>
    </div>
  );
}

export default function ProdutoIndicadores({
  total,
  ativos,
  inativos,
  estoqueBaixo,
}: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card titulo="Produtos" valor={total} />
      <Card titulo="Ativos" valor={ativos} />
      <Card titulo="Inativos" valor={inativos} />
      <Card titulo="Estoque Baixo" valor={estoqueBaixo} />
    </section>
  );
}
