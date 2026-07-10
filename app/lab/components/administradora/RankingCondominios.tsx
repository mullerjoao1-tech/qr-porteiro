"use client";

const ranking = [
  {
    nome: "Residencial Tulipas",
    nota: "98%",
  },
  {
    nome: "Residencial Itália",
    nota: "96%",
  },
  {
    nome: "Jardim Europa",
    nota: "91%",
  },
  {
    nome: "Solar das Flores",
    nota: "74%",
  },
];

export default function RankingCondominios() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">
          Ranking da Carteira
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Indicador geral de saúde operacional dos condomínios.
        </p>
      </div>

      <div className="space-y-3">
        {ranking.map((item, index) => (
          <div
            key={item.nome}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div>
              <p className="text-sm text-slate-500">
                #{index + 1}
              </p>

              <h3 className="font-black text-slate-900">
                {item.nome}
              </h3>
            </div>

            <strong className="text-xl font-black text-emerald-600">
              {item.nota}
            </strong>
          </div>
        ))}
      </div>

    </section>
  );
}