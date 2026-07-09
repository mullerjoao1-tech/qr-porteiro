"use client";

import IndicadorStatus from "./IndicadorStatus";

export default function SaudeCondominio() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Saúde operacional
        </p>
        <h2 className="text-2xl font-bold text-slate-900">
          Saúde do Condomínio
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Visão rápida dos pontos mais importantes da operação. Nesta primeira
          versão, os dados são demonstrativos para validar o layout no LAB.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IndicadorStatus
          titulo="Fluxo visitante ↔ morador"
          descricao="Chamadas, mensagens e popup universal estão funcionando."
          status="ok"
        />

        <IndicadorStatus
          titulo="Push notifications"
          descricao="Notificações ativas para alertar o responsável pelo atendimento."
          status="ok"
        />

        <IndicadorStatus
          titulo="Câmera do portão"
          descricao="Snapshot/câmera já validada e pronta para evoluir em histórico."
          status="ok"
        />

        <IndicadorStatus
          titulo="Abertura do portão"
          descricao="Comando de abertura funcionando, mantendo cuidado com segurança."
          status="ok"
        />

        <IndicadorStatus
          titulo="Cadastros"
          descricao="Área preparada para receber moradores, unidades e permissões."
          status="atencao"
        />

        <IndicadorStatus
          titulo="IA e alertas automáticos"
          descricao="Será conectado nas próximas Sprints após estabilizar o LAB."
          status="neutro"
        />
      </div>
    </section>
  );
}
