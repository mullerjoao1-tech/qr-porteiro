"use client";

import type { FiltroStatusServico } from "./ServicoTypes";

interface Props {
  busca: string;
  filtroStatus: FiltroStatusServico;
  onBuscaChange: (valor: string) => void;
  onFiltroChange: (valor: FiltroStatusServico) => void;
  onNovoServico: () => void;
}

export default function ServicoFiltros({
  busca,
  filtroStatus,
  onBuscaChange,
  onFiltroChange,
  onNovoServico,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-500"
        />

        <select
          value={filtroStatus}
          onChange={(e) =>
            onFiltroChange(
              e.target.value as FiltroStatusServico
            )
          }
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>

        <button
          onClick={onNovoServico}
          className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white transition hover:bg-pink-500"
        >
          + Novo serviço
        </button>
      </div>
    </div>
  );
}
