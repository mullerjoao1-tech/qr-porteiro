"use client";

import type { FiltroStatusProduto } from "./ProdutoTypes";

interface Props {
  busca: string;
  filtroStatus: FiltroStatusProduto;
  onBuscaChange: (valor: string) => void;
  onFiltroChange: (valor: FiltroStatusProduto) => void;
  onNovoProduto: () => void;
}

export default function ProdutoFiltros({
  busca,
  filtroStatus,
  onBuscaChange,
  onFiltroChange,
  onNovoProduto,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome, categoria ou marca..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-500"
        />

        <select
          value={filtroStatus}
          onChange={(e) =>
            onFiltroChange(e.target.value as FiltroStatusProduto)
          }
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>

        <button
          type="button"
          onClick={onNovoProduto}
          className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white transition hover:bg-pink-500"
        >
          + Novo produto
        </button>
      </div>
    </div>
  );
}
