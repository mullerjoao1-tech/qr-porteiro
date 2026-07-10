"use client";

const alertas = [
  {
    status: "🔴 Crítico",
    condominio: "Solar das Flores",
    titulo: "Portão principal aberto",
    tempo: "há 12 min",
    acao: "Abrir",
  },
  {
    status: "🟡 Atenção",
    condominio: "Jardim Europa",
    titulo: "Contrato vence amanhã",
    tempo: "hoje",
    acao: "Revisar",
  },
  {
    status: "🔵 Programado",
    condominio: "Residencial Itália",
    titulo: "Assembleia às 19h",
    tempo: "19:00",
    acao: "Preparar",
  },
];

export default function AlertasAdministradora() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Central de Operações
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Eventos ativos que merecem acompanhamento.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          Atualizado 09:54
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {alertas.map((item) => (
          <div
            key={item.titulo}
            className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {item.status} • {item.tempo}
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                {item.condominio}
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {item.titulo}
              </p>
            </div>

            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              {item.acao} →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}