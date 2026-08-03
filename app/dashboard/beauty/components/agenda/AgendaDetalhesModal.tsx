"use client";

import type { Agendamento } from "./AgendaTypes";
import { obterStatus } from "./AgendaStatus";
import AgendaTimeline from "./AgendaTimeline";
import { formatarValor } from "./AgendaUtils";

type AgendaDetalhesModalProps = {
  agendamento: Agendamento;
  fechar: () => void;
};

export default function AgendaDetalhesModal({
  agendamento,
  fechar,
}: AgendaDetalhesModalProps) {
  const status = obterStatus(agendamento.status);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 md:p-6">
      <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-pink-300">
              {agendamento.id}
            </p>

            <h3 className="mt-1 text-2xl font-black text-white">
              {agendamento.cliente}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {agendamento.telefone}
            </p>
          </div>

          <button
            type="button"
            onClick={fechar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black transition-all hover:bg-slate-700 active:scale-95"
            aria-label="Fechar detalhes"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <InformacaoDetalhe
            titulo="HORÁRIO"
            valor={agendamento.horario}
          />

          <InformacaoDetalhe
            titulo="DURAÇÃO"
            valor={`${agendamento.duracaoMinutos} minutos`}
          />

          <InformacaoDetalhe
            titulo="SERVIÇO"
            valor={agendamento.servico}
          />

          <InformacaoDetalhe
            titulo="PROFISSIONAL"
            valor={agendamento.profissional}
          />

          <InformacaoDetalhe
            titulo="VALOR"
            valor={formatarValor(agendamento.valor)}
          />

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-[10px] font-black text-slate-500">
              STATUS
            </p>

            <span
              className={`mt-2 inline-flex rounded-full border px-3 py-2 text-xs font-black ${status.classes}`}
            >
              {status.icone} {status.texto}
            </span>
          </div>
        </div>

        {agendamento.observacoes && (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              OBSERVAÇÕES
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {agendamento.observacoes}
            </p>
          </div>
        )}

        <AgendaTimeline />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-blue-700 bg-blue-950/40 py-3 font-black text-blue-300 transition-all hover:bg-blue-950 active:scale-95"
          >
            🔵 Iniciar atendimento
          </button>

          <button
            type="button"
            className="rounded-xl border border-green-700 bg-green-950/40 py-3 font-black text-green-300 transition-all hover:bg-green-950 active:scale-95"
          >
            ✅ Marcar como confirmado
          </button>

          <button
            type="button"
            className="rounded-xl border border-purple-700 bg-purple-950/40 py-3 font-black text-purple-300 transition-all hover:bg-purple-950 active:scale-95"
          >
            🟣 Reagendar
          </button>

          <button
            type="button"
            className="rounded-xl border border-red-700 bg-red-950/40 py-3 font-black text-red-300 transition-all hover:bg-red-950 active:scale-95"
          >
            🔴 Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

type InformacaoDetalheProps = {
  titulo: string;
  valor: string;
};

function InformacaoDetalhe({
  titulo,
  valor,
}: InformacaoDetalheProps) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-[10px] font-black text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-sm font-black text-white">
        {valor}
      </p>
    </div>
  );
}
