"use client";

import { ReactNode } from "react";

type VarianteCard =
  | "padrao"
  | "destaque"
  | "sucesso"
  | "aviso"
  | "perigo"
  | "info"
  | "neutro";

type CardProps = {
  children: ReactNode;
  titulo?: string;
  subtitulo?: string;
  icone?: string;
  variante?: VarianteCard;
  acao?: ReactNode;
  rodape?: ReactNode;
  clicavel?: boolean;
  className?: string;
  onClick?: () => void;
};

export default function Card({
  children,
  titulo,
  subtitulo,
  icone,
  variante = "padrao",
  acao,
  rodape,
  clicavel = false,
  className = "",
  onClick,
}: CardProps) {
  const variantes: Record<VarianteCard, string> = {
    padrao: "bg-slate-900 border-slate-800",
    destaque: "bg-slate-900 border-blue-500/50",
    sucesso: "bg-green-950/40 border-green-500/50",
    aviso: "bg-yellow-950/30 border-yellow-500/50",
    perigo: "bg-red-950/40 border-red-500/50",
    info: "bg-blue-950/40 border-blue-500/50",
    neutro: "bg-slate-800 border-slate-700",
  };

  const efeitoClique =
    clicavel || onClick
      ? "cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:border-slate-500"
      : "";

  return (
    <section
      onClick={onClick}
      className={`rounded-3xl border p-4 shadow-xl transition-all ${variantes[variante]} ${efeitoClique} ${className}`}
    >
      {(titulo || subtitulo || icone || acao) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            {icone && (
              <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                {icone}
              </div>
            )}

            <div>
              {titulo && (
                <h3 className="text-white text-lg font-black leading-tight">
                  {titulo}
                </h3>
              )}

              {subtitulo && (
                <p className="text-slate-400 text-sm mt-1 leading-snug">
                  {subtitulo}
                </p>
              )}
            </div>
          </div>

          {acao && <div className="shrink-0">{acao}</div>}
        </div>
      )}

      <div>{children}</div>

      {rodape && (
        <div className="mt-4 pt-3 border-t border-slate-700/70">{rodape}</div>
      )}
    </section>
  );
}
