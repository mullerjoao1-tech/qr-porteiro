"use client";

type Indicador = {
  titulo: string;
  valor: string;
  descricao: string;
  acao: string;
  cor: string;
};

const indicadores: Indicador[] = [
  {
    titulo: "Moradores",
    valor: "184",
    descricao: "cadastrados",
    acao: "Ver moradores →",
    cor: "#22c55e",
  },
  {
    titulo: "Chamados",
    valor: "12",
    descricao: "2 aguardando",
    acao: "Ver chamados →",
    cor: "#facc15",
  },
  {
    titulo: "Entregas",
    valor: "4",
    descricao: "1 aguardando retirada",
    acao: "Ver entregas →",
    cor: "#facc15",
  },
  {
    titulo: "Alertas",
    valor: "0",
    descricao: "operação normal",
    acao: "Ver alertas →",
    cor: "#22c55e",
  },
];

export default function KPIs() {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {indicadores.map((item) => (
        <button
          key={item.titulo}
          type="button"
          className="flex min-h-[150px] w-full flex-col rounded-3xl border border-slate-900 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex justify-center">
            <span
              className="block h-5 w-5 rounded-full border-2 border-slate-900"
              style={{ backgroundColor: item.cor }}
            />
          </div>

          <h3 className="mt-3 text-sm font-black text-slate-950">
            {item.titulo}
          </h3>

          <div className="mt-1 flex items-end gap-1">
            <strong className="text-3xl font-black leading-none text-slate-950">
              {item.valor}
            </strong>

            <span className="mb-0.5 text-xs font-semibold text-slate-500">
              {item.descricao}
            </span>
          </div>

          <p className="mt-auto pt-3 text-sm font-black text-blue-700">
            {item.acao}
          </p>
        </button>
      ))}
    </section>
  );
}