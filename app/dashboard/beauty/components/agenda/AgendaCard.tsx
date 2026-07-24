"use client";

import { Agendamento } from "./AgendaTypes";
import { obterStatus } from "./AgendaStatus";
import {
  calcularFimHorario,
  formatarValor,
} from "./AgendaUtils";

type AgendaCardProps = {
  agendamento: Agendamento;
  onClick?: () => void;
};

export default function AgendaCard({
  agendamento,
  onClick,
}: AgendaCardProps) {
  const status = obterStatus(
    agendamento.status
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl border border-slate-700 bg-slate-800 p-5 text-left transition-all hover:border-pink-500 hover:bg-slate-700 active:scale-[0.99]"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

        {/* Horário */}

        <div className="lg:w-36">
          <div className="rounded-2xl bg-slate-950 p-4 text-center">
            <p className="text-3xl font-black text-white">
              {agendamento.horario}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              até{" "}
              {calcularFimHorario(
                agendamento.horario,
                agendamento.duracaoMinutos
              )}
            </p>
          </div>
        </div>

        {/* Conteúdo */}

        <div className="flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="text-xl font-black text-white">
              {agendamento.cliente}
            </h3>

            {agendamento.clienteNovo && (
              <span className="rounded-full border border-cyan-700 bg-cyan-950/40 px-3 py-1 text-[10px] font-black text-cyan-300">
                NOVO CLIENTE
              </span>
            )}

            {agendamento.prioridade ===
              "alta" && (
              <span className="rounded-full border border-red-700 bg-red-950/40 px-3 py-1 text-[10px] font-black text-red-300">
                PRIORIDADE
              </span>
            )}
          </div>

          <p className="mt-2 font-bold text-pink-300">
            ✂️ {agendamento.servico}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">

            <span>
              💇 {agendamento.profissional}
            </span>

            <span>
              ⏱ {agendamento.duracaoMinutos} min
            </span>

            <span>
              💰 {formatarValor(
                agendamento.valor
              )}
            </span>

          </div>

          {/* Recursos inteligentes */}

          <div className="mt-5 flex flex-wrap gap-2">

            {agendamento.filaEspera && (
  <span className="rounded-full border border-violet-700 bg-violet-950/40 px-3 py-1 text-xs font-black">
    👥 Fila de espera
  </span>
)}

            {agendamento.podeAntecipar && (
              <span className="rounded-full border border-emerald-700 bg-emerald-950/40 px-3 py-1 text-xs font-black text-emerald-300">
                ⚡ Pode antecipar
              </span>
            )}

            {agendamento.atrasadoMinutos &&
              agendamento.atrasadoMinutos >
                0 && (
                <span className="rounded-full border border-orange-700 bg-orange-950/40 px-3 py-1 text-xs font-black text-orange-300">
                  ⏰ {agendamento.atrasadoMinutos}
                  min atraso
                </span>
              )}

            {agendamento.clienteCostumaAtrasar && (
              <span className="rounded-full border border-yellow-700 bg-yellow-950/40 px-3 py-1 text-xs font-black text-yellow-300">
                ⚠ Cliente costuma atrasar
              </span>
            )}

            {agendamento.confirmadoAutomaticamente && (
              <span className="rounded-full border border-green-700 bg-green-950/40 px-3 py-1 text-xs font-black text-green-300">
                🤖 Confirmação automática
              </span>
            )}

          </div>

          {agendamento.observacoes && (
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <p className="text-[10px] font-black text-slate-500">
                OBSERVAÇÕES
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {agendamento.observacoes}
              </p>
            </div>
          )}
        </div>

        {/* Status */}

        <div className="flex flex-col items-start gap-3 lg:items-end">

          <span
            className={`inline-flex rounded-full border px-4 py-2 text-xs font-black ${status.classes}`}
          >
            {status.icone} {status.texto}
          </span>

          <span className="text-sm font-black text-pink-300">
            Abrir →
          </span>

        </div>
      </div>
    </button>
  );
}