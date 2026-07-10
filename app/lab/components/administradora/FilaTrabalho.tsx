"use client";

const grupos = [
  {
    titulo: "Críticos",
    contador: "1",
    resumo: "Ação imediata",
    cor: "text-red-700",
    marcador: "bg-red-500",
    itens: [
      {
        condominio: "Solar das Flores",
        titulo: "Portão principal aberto há 12 min",
        responsavel: "Operação",
        ultimaAtividade: "09:12",
        acao: "Resolver",
      },
    ],
  },
  {
    titulo: "Atenção",
    contador: "2",
    resumo: "Resolver hoje",
    cor: "text-amber-700",
    marcador: "bg-amber-400",
    itens: [
      {
        condominio: "Jardim Europa",
        titulo: "Contrato de limpeza vence amanhã",
        responsavel: "Administrativo",
        ultimaAtividade: "08:40",
        acao: "Renovar",
      },
      {
        condominio: "Residencial Tulipas",
        titulo: "Prestador não realizou check-in",
        responsavel: "Síndico",
        ultimaAtividade: "08:22",
        acao: "Contato",
      },
    ],
  },
  {
    titulo: "Programados",
    contador: "1",
    resumo: "Acompanhar",
    cor: "text-blue-700",
    marcador: "bg-blue-500",
    itens: [
      {
        condominio: "Residencial Itália",
        titulo: "Assembleia hoje às 19:00",
        responsavel: "Administradora",
        ultimaAtividade: "07:50",
        acao: "Preparar",
      },
    ],
  },
  {
    titulo: "Operação normal",
    contador: "47",
    resumo: "Sem pendências críticas",
    cor: "text-emerald-700",
    marcador: "bg-emerald-500",
    itens: [
      {
        condominio: "Residencial América",
        titulo: "Operação estável",
        responsavel: "Carteira",
        ultimaAtividade: "09:05",
        acao: "Abrir",
      },
      {
        condominio: "Residencial Primavera",
        titulo: "Tudo atualizado",
        responsavel: "Carteira",
        ultimaAtividade: "08:55",
        acao: "Abrir",
      },
    ],
  },
];

export default function FilaTrabalho() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Central de Prioridades da Carteira
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Condomínios agrupados pelo que exige ação da administradora.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          51 acompanhamentos hoje
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {grupos.map((grupo) => (
          <div
            key={grupo.titulo}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className={`text-lg font-black ${grupo.cor}`}>
                  {grupo.titulo}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {grupo.resumo}
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                {grupo.contador}
              </span>
            </div>

            <div className="space-y-3">
              {grupo.itens.map((item) => (
                <button
                  key={`${grupo.titulo}-${item.condominio}-${item.titulo}`}
                  className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${grupo.marcador}`}
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-slate-900">
                        {item.condominio}
                      </h4>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {item.titulo}
                      </p>

                      <p className="mt-2 text-xs font-bold text-slate-500">
                        👤 {item.responsavel} • {item.ultimaAtividade}
                      </p>

                      <p className="mt-3 text-xs font-black uppercase tracking-wide text-blue-700">
                        {item.acao} →
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}