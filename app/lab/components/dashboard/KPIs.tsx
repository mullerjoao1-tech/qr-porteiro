"use client";

const indicadores = [
  {
    titulo: "Moradores",
    valor: "184",
    descricao: "cadastrados",
    status: "🟢 Todos ativos",
    detalhe: "Ver moradores →",
    destaque: true,
  },
  {
    titulo: "Chamados",
    valor: "12",
    descricao: "registrados hoje",
    status: "🟡 2 aguardando",
    detalhe: "Ver chamados →",
    destaque: false,
  },
  {
    titulo: "Entregas",
    valor: "4",
    descricao: "previstas hoje",
    status: "🟡 1 aguardando retirada",
    detalhe: "Ver entregas →",
    destaque: false,
  },
  {
    titulo: "Alertas",
    valor: "0",
    descricao: "críticos agora",
    status: "🟢 Operação normal",
    detalhe: "Ver alertas →",
    destaque: false,
  },
];

export default function KPIs() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {indicadores.map((item) => (
        <button
          key={item.titulo}
          className={`rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
            item.destaque
              ? "border-blue-200 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-950"
          }`}
        >
          <p
            className={`text-sm font-bold ${
              item.destaque ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {item.titulo}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <strong className="text-4xl font-black tracking-tight">
              {item.valor}
            </strong>

            <span
              className={`mb-1 text-sm font-semibold ${
                item.destaque ? "text-blue-100" : "text-slate-500"
              }`}
            >
              {item.descricao}
            </span>
          </div>

          <div
            className={`mt-4 rounded-2xl px-3 py-2 text-sm font-bold ${
              item.destaque
                ? "bg-white/15 text-white"
                : "bg-slate-50 text-slate-700"
            }`}
          >
            {item.status}
          </div>

          <p
            className={`mt-4 text-sm font-black ${
              item.destaque ? "text-white" : "text-blue-700"
            }`}
          >
            {item.detalhe}
          </p>
        </button>
      ))}
    </section>
  );
}