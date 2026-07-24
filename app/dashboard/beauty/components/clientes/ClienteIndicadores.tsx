"use client";

type ClienteIndicadoresProps = {
  total: number;
  ativos: number;
  inativos: number;
  visitas: number;
  faturamento: number;
};

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ClienteIndicadores({
  total,
  ativos,
  inativos,
  visitas,
  faturamento,
}: ClienteIndicadoresProps) {
  const indicadores = [
    { titulo: "Clientes", valor: String(total), icone: "👥" },
    { titulo: "Ativos", valor: String(ativos), icone: "✅" },
    { titulo: "Inativos", valor: String(inativos), icone: "⏸️" },
    { titulo: "Visitas", valor: String(visitas), icone: "📅" },
    { titulo: "Valor gerado", valor: formatarValor(faturamento), icone: "💰" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {indicadores.map((indicador) => (
        <article
          key={indicador.titulo}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {indicador.titulo}
            </p>
            <span className="text-xl">{indicador.icone}</span>
          </div>

          <p className="mt-3 text-2xl font-black text-white">
            {indicador.valor}
          </p>
        </article>
      ))}
    </section>
  );
}
