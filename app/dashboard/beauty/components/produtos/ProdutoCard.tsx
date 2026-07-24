"use client";

import type { ProdutoBeauty } from "./ProdutoTypes";

interface Props {
  produto: ProdutoBeauty;
  onAbrir: (produto: ProdutoBeauty) => void;
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function ProdutoCard({
  produto,
  onAbrir,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(produto)}
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-pink-500"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-white">
            {produto.nome}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {produto.categoria}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            produto.status === "ativo"
              ? "bg-emerald-900/40 text-emerald-300"
              : "bg-red-900/40 text-red-300"
          }`}
        >
          {produto.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase text-slate-500">
            Preço
          </p>

          <p className="mt-1 text-2xl font-black text-pink-300">
            {moeda(produto.preco)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">
            Estoque
          </p>

          <p className="mt-1 text-2xl font-black text-white">
            {produto.estoque} {produto.unidade}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Toque para detalhes
        </span>

        <span className="text-xl text-pink-400">
          →
        </span>
      </div>
    </button>
  );
}
