"use client";

import CardMetrica from "./CardMetrica";

export default function ResumoInteligente() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Central Inteligente
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            Resumo do condomínio
          </h2>
        </div>

        <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          🧪 Ambiente LAB
        </span>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="text-lg font-bold text-slate-900">
          Bom dia, João. O condomínio está operando normalmente.
        </h3>

        <p className="mt-2 leading-relaxed text-slate-700">
          Nas últimas 24 horas, o QR Acesso registrou chamados, mensagens e
          acessos sem alertas críticos. Esta área será ligada ao Firebase e à IA
          nas próximas Sprints para gerar análises automáticas em tempo real.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardMetrica
          titulo="Chamados hoje"
          valor="12"
          descricao="Atendimentos registrados no período."
          icone="📞"
          tendencia="alta"
          destaque
        />

        <CardMetrica
          titulo="Atendidos"
          valor="10"
          descricao="Chamados respondidos pelo responsável."
          icone="✅"
          tendencia="alta"
        />

        <CardMetrica
          titulo="Pendentes"
          valor="2"
          descricao="Ocorrências que merecem acompanhamento."
          icone="⏳"
          tendencia="neutra"
        />

        <CardMetrica
          titulo="Alertas"
          valor="0"
          descricao="Nenhum alerta crítico no momento."
          icone="🚨"
          tendencia="alta"
        />
      </div>
    </section>
  );
}
