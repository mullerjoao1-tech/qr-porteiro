"use client";

import type { FiltroStatus } from "./AgendaTypes";

type AgendaFiltrosProps = {
  busca: string;
  filtroStatus: FiltroStatus;
  onBuscaChange: (valor: string) => void;
  onFiltroChange: (filtro: FiltroStatus) => void;
  onNovoAgendamento: () => void;
};

const OPCOES_STATUS: Array<{
  id: FiltroStatus;
  nome: string;
}> = [
  { id: "todos", nome: "Todos" },
  { id: "aguardando", nome: "Aguardando" },
  { id: "confirmado", nome: "Confirmados" },
  { id: "em-atendimento", nome: "Em atendimento" },
  { id: "finalizado", nome: "Finalizados" },
  { id: "cancelado", nome: "Cancelados" },
];

export default function AgendaFiltros({
  busca,
  filtroStatus,
  onBuscaChange,
  onFiltroChange,
  onNovoAgendamento,
}: AgendaFiltrosProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🔍
          </span>

          <input
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Buscar cliente, profissional ou serviço..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-500 focus:border-pink-500"
          />
        </div>

        <button
          type="button"
          onClick={onNovoAgendamento}
          className="rounded-xl bg-pink-600 px-5 py-3 font-black text-white transition-all hover:bg-pink-500 active:scale-95"
        >
          ＋ Agendar
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {OPCOES_STATUS.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            onClick={() => onFiltroChange(opcao.id)}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-black transition-all ${
              filtroStatus === opcao.id
                ? "border-pink-500 bg-pink-600 text-white"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {opcao.nome}
          </button>
        ))}
      </div>
    </section>
  );
}
