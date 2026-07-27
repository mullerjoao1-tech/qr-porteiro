"use client";

import { useQRTheme } from "../provider";

import type { CoreHeroProps } from "./CoreHeroTypes";

export default function CoreHero({
  badge,
  titulo,
  descricao,
  botaoPrincipal,
  botaoSecundario,
  extra,
}: CoreHeroProps) {
  const theme = useQRTheme();

  return (
    <section
      className={`rounded-3xl border border-white/10 bg-gradient-to-r ${theme.gradiente} p-5 shadow-xl md:p-7`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            {badge && (
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur">
                {badge}
              </div>
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl text-white backdrop-blur">
              {theme.icone}
            </div>
          </div>

          <h1 className="mt-4 break-words text-3xl font-black leading-tight text-white md:text-4xl">
            {titulo}
          </h1>

          {descricao && (
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-white/90 md:text-base">
              {descricao}
            </p>
          )}

          {(botaoPrincipal || botaoSecundario) && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {botaoPrincipal && (
                <button
                  type="button"
                  onClick={botaoPrincipal.onClick}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-900 shadow transition-all hover:bg-slate-100 active:scale-95"
                >
                  {botaoPrincipal.texto}
                </button>
              )}

              {botaoSecundario && (
                <button
                  type="button"
                  onClick={botaoSecundario.onClick}
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition-all hover:bg-white/20 active:scale-95"
                >
                  {botaoSecundario.texto}
                </button>
              )}
            </div>
          )}

          {extra && <div className="mt-3 max-w-sm">{extra}</div>}
        </div>
      </div>
    </section>
  );
}