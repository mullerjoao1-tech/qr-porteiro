"use client";

export default function ResumoDia() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
            Resumo do Dia
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
            Hoje o condomínio está operando normalmente.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-500 md:text-base">
            Nenhum alerta crítico foi identificado até o momento. Existem
            algumas pendências leves que podem ser acompanhadas ao longo do dia.
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          Atualizado agora
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">📞 12 chamados hoje</p>
          <p className="mt-1 text-sm text-slate-500">
            A maioria foi atendida normalmente.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">📦 1 entrega pendente</p>
          <p className="mt-1 text-sm text-slate-500">
            Aguardando retirada ou confirmação do morador.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">
            🛠 2 prestadores previstos
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Agenda do dia preparada para acompanhamento.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">
            ✅ Nenhum alerta crítico
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Operação normal até o momento.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-black text-blue-900">💡 Sugestão inteligente</p>

        <p className="mt-2 text-sm leading-relaxed text-blue-800">
          Hoje é um bom dia para revisar cadastros pendentes e preparar os
          comunicados da semana. Nas próximas Sprints, esta sugestão será gerada
          automaticamente pela IA com base nos dados reais do condomínio.
        </p>
      </div>
    </section>
  );
}