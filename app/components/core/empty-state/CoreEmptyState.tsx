"use client";

import { useQRTheme } from "../provider";

import type { CoreEmptyStateProps } from "./CoreEmptyStateTypes";

export default function CoreEmptyState({
  titulo = "Nenhum registro encontrado",
  descricao = "Não existem dados para exibir no momento.",
  icone,
  textoAcao,
  onAcao,
  compacto = false,
}: CoreEmptyStateProps) {
  const theme = useQRTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 text-center ${
        compacto ? "p-6" : "p-10"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-2xl bg-white/5 ${
          compacto ? "h-14 w-14 text-3xl" : "h-20 w-20 text-5xl"
        }`}
      >
        {icone ?? theme.icone}
      </div>

      <h3
        className={`font-black text-white ${
          compacto ? "mt-4 text-lg" : "mt-5 text-2xl"
        }`}
      >
        {titulo}
      </h3>

      <p
        className={`max-w-md leading-relaxed text-slate-400 ${
          compacto ? "mt-2 text-sm" : "mt-3 text-base"
        }`}
      >
        {descricao}
      </p>

      {textoAcao && onAcao && (
        <button
          type="button"
          onClick={onAcao}
          className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-900 shadow transition-all hover:bg-slate-100 active:scale-95"
        >
          {textoAcao}
        </button>
      )}
    </div>
  );
}
