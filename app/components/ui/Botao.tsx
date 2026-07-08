"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type VarianteBotao =
  | "primario"
  | "secundario"
  | "sucesso"
  | "perigo"
  | "aviso"
  | "neutro"
  | "fantasma";

type TamanhoBotao = "sm" | "md" | "lg";

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  icone?: string;
  carregando?: boolean;
  larguraTotal?: boolean;
};

export default function Botao({
  children,
  variante = "primario",
  tamanho = "md",
  icone,
  carregando = false,
  larguraTotal = true,
  disabled,
  className = "",
  ...props
}: BotaoProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

  const variantes: Record<VarianteBotao, string> = {
    primario: "bg-blue-600 hover:bg-blue-500 text-white",
    secundario: "bg-slate-700 hover:bg-slate-600 text-white",
    sucesso: "bg-green-500 hover:bg-green-400 text-black",
    perigo: "bg-red-600 hover:bg-red-500 text-white",
    aviso: "bg-yellow-500 hover:bg-yellow-400 text-black",
    neutro: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600",
    fantasma: "bg-transparent hover:bg-slate-800 text-slate-200 border border-slate-700",
  };

  const tamanhos: Record<TamanhoBotao, string> = {
    sm: "text-xs px-3 py-2",
    md: "text-sm px-4 py-3",
    lg: "text-base px-5 py-4",
  };

  const largura = larguraTotal ? "w-full" : "";

  return (
    <button
      disabled={disabled || carregando}
      className={`${base} ${variantes[variante]} ${tamanhos[tamanho]} ${largura} ${className}`}
      {...props}
    >
      {carregando ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Carregando...</span>
        </>
      ) : (
        <>
          {icone && <span>{icone}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
