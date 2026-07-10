"use client";

const grupos = [
  {
    titulo: "Críticos",
    resumo: "Ação imediata",
    contador: "1",
    corTitulo: "text-red-700",
    condominios: [
      {
        nome: "Solar das Flores",
        status: "🔴 Crítico",
        cidade: "São José dos Pinhais",
        unidades: "48 unidades",
        detalhe: "Portão aberto há 12 minutos",
        ultimaAtividade: "09:12",
      },
    ],
  },
  {
    titulo: "Atenção",
    resumo: "Pendências para hoje",
    contador: "2",
    corTitulo: "text-amber-700",
    condominios: [
      {
        nome: "Jardim Europa",
        status: "🟡 Atenção",
        cidade: "Curitiba",
        unidades: "64 unidades",
        detalhe: "Contrato vence amanhã",
        ultimaAtividade: "08:40",
      },
      {
        nome: "Residencial América",
        status: "🟡 Atenção",
        cidade: "Curitiba",
        unidades: "36 unidades",
        detalhe: "Balancete aguardando conferência",
        ultimaAtividade: "Ontem",
      },
    ],
  },
  {
    titulo: "Operação normal",
    resumo: "Sem pendências críticas",
    contador: "47",
    corTitulo: "text-emerald-700",
    condominios: [
      {
        nome: "Residencial Tulipas",
        status: "🟢 Operação normal",
        cidade: "Curitiba",
        unidades: "32 unidades",
        detalhe: "Tudo atualizado",
        ultimaAtividade: "09:18",
      },
      {
        nome: "Residencial Itália",
        status: "🟢 Operação normal",
        cidade: "Curitiba",
        unidades: "40 unidades",
        detalhe: "Operação estável",
        ultimaAtividade: "08:55",
      },
      {
        nome: "Solar Primavera",
        status: "🟢 Operação normal",
        cidade: "Colombo",
        unidades: "28 unidades",
        detalhe: "Sem ocorrências relevantes",
        ultimaAtividade: "08:10",
      },
    ],
  },
];

export default function CarteiraCondominios() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-900">
          Carteira de Condomínios
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Condomínios agrupados por prioridade operacional.
        </p>
      </div>

      <div className="space-y-4">
        {grupos.map((grupo) => (
          <div
            key={grupo.titulo}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-black ${grupo.corTitulo}`}>
                  ▼ {grupo.titulo}
                </h3>

                <p className="text-sm text-slate-500">
                  {grupo.resumo}
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                {grupo.contador}
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {grupo.condominios.map((condominio) => (
                <button
                  key={condominio.nome}
                  className="flex w-full flex-col gap-2 py-3 text-left transition hover:translate-x-1 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-slate-900">
                        🏢 {condominio.nome}
                      </h4>

                      <span className="text-sm font-bold text-slate-700">
                        {condominio.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {condominio.detalhe}
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {condominio.cidade} • {condominio.unidades} • Última atividade:{" "}
                      {condominio.ultimaAtividade}
                    </p>
                  </div>

                  <span className="text-sm font-black text-blue-700">
                    Abrir →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}