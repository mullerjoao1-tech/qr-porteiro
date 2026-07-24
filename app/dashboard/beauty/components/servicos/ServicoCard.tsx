"use client";

import type { ServicoBeauty } from "./ServicoTypes";

interface ServicoCardProps {
  servico: ServicoBeauty;
  onAbrir: (servico: ServicoBeauty) => void;
}

function formatarValor(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function ServicoCard({
  servico,
  onAbrir,
}: ServicoCardProps) {
  const ativo = servico.status === "ativo";

  return (
    <button
      type="button"
      onClick={() => onAbrir(servico)}
      className="group w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-pink-500/50 hover:bg-slate-900/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-white">
            {servico.nome}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {servico.categoria}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            ativo
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {ativo ? "ATIVO" : "INATIVO"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500">
            Valor
          </p>

          <p className="font-black text-pink-300">
            {formatarValor(servico.valor)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">
            Duração
          </p>

          <p className="font-black text-white">
            {servico.duracaoMinutos} min
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Toque para ver detalhes
        </span>

        <span className="text-pink-400 transition group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>
  );
}
