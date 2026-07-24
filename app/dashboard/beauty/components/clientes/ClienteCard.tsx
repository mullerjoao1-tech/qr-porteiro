"use client";

import type { ClienteBeauty } from "./ClienteTypes";

type ClienteCardProps = {
  cliente: ClienteBeauty;
  onAbrir: (cliente: ClienteBeauty) => void;
};

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ClienteCard({
  cliente,
  onAbrir,
}: ClienteCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(cliente)}
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-pink-500/60 hover:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-600/20 text-lg font-black text-pink-300">
              {cliente.nome.trim().charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">
                {cliente.nome}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {formatarTelefone(cliente.telefone)}
              </p>
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
            cliente.status === "ativo"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {cliente.status === "ativo" ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Visitas
          </p>
          <p className="mt-1 font-black text-white">
            {cliente.totalVisitas}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Valor gerado
          </p>
          <p className="mt-1 font-black text-white">
            {formatarValor(cliente.valorTotalGasto)}
          </p>
        </div>
      </div>
    </button>
  );
}
