"use client";

const eventos = [
  {
    hora: "09:42",
    icone: "🚪",
    titulo: "Portão aberto",
    descricao: "Abertura registrada no portão principal.",
    status: "🟢 Normal",
  },
  {
    hora: "09:30",
    icone: "📦",
    titulo: "Entrega registrada",
    descricao: "Entrega recebida e aguardando retirada.",
    status: "🟡 Acompanhar",
  },
  {
    hora: "09:10",
    icone: "🔧",
    titulo: "Prestador realizou check-in",
    descricao: "Empresa de manutenção entrou no condomínio.",
    status: "🟢 Normal",
  },
  {
    hora: "08:55",
    icone: "👥",
    titulo: "Morador atualizado",
    descricao: "Cadastro da unidade 22 foi revisado.",
    status: "🔵 Informação",
  },
];

export default function TimelineCondominio() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-950">
          Últimas atividades
        </h2>

        <p className="text-sm text-slate-500">
          Eventos recentes deste condomínio.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {eventos.map((evento) => (
          <div
            key={`${evento.hora}-${evento.titulo}`}
            className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                {evento.icone}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-900">
                    {evento.titulo}
                  </h3>

                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    {evento.status}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {evento.descricao}
                </p>
              </div>
            </div>

            <span className="text-sm font-black text-slate-500">
              {evento.hora}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}