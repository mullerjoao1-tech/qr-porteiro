 "use client";

import type { FiltroStatusProfissional } from "./ProfissionalTypes";

interface Props {
  busca: string;
  filtroStatus: FiltroStatusProfissional;
  onBuscaChange: (valor: string) => void;
  onFiltroChange: (valor: FiltroStatusProfissional) => void;
  onNovoProfissional: () => void;
}

export default function ProfissionalFiltros({
  busca,
  filtroStatus,
  onBuscaChange,
  onFiltroChange,
  onNovoProfissional,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome, telefone ou especialidade..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-500"
        />

        <select
          value={filtroStatus}
          onChange={(e) =>
            onFiltroChange(
              e.target.value as FiltroStatusProfissional
            )
          }
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>

        <button
          onClick={onNovoProfissional}
          className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white transition hover:bg-pink-500"
        >
          + Novo profissional
        </button>
      </div>
    </div>
  );
}
