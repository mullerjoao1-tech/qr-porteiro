"use client";

import { useEffect } from "react";

import { useQRTheme } from "../provider";

import type {
  CoreModalProps,
  CoreModalTamanho,
} from "./CoreModalTypes";

const classesPorTamanho: Record<CoreModalTamanho, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[calc(100vw-2rem)]",
};

export default function CoreModal({
  aberto,
  titulo,
  subtitulo,
  icone,
  tamanho = "md",
  children,
  footer,
  fecharAoClicarFora = true,
  fecharComEsc = true,
  mostrarBotaoFechar = true,
  onFechar,
}: CoreModalProps) {
  const theme = useQRTheme();

  useEffect(() => {
    if (!aberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && fecharComEsc) {
        onFechar();
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto, fecharComEsc, onFechar]);

  if (!aberto) {
    return null;
  }

  function aoClicarFundo() {
    if (fecharAoClicarFora) {
      onFechar();
    }
  }

  function impedirFechamento(evento: React.MouseEvent<HTMLDivElement>) {
    evento.stopPropagation();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo ?? "Modal"}
      onMouseDown={aoClicarFundo}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div
        onMouseDown={impedirFechamento}
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl ${classesPorTamanho[tamanho]}`}
      >
        {(titulo || subtitulo || mostrarBotaoFechar) && (
          <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 md:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                {icone ?? theme.icone}
              </div>

              <div className="min-w-0">
                {titulo && (
                  <h2 className="break-words text-xl font-black text-white md:text-2xl">
                    {titulo}
                  </h2>
                )}

                {subtitulo && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {subtitulo}
                  </p>
                )}
              </div>
            </div>

            {mostrarBotaoFechar && (
              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar modal"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-black text-slate-300 transition-all hover:bg-slate-700 hover:text-white active:scale-95"
              >
                ×
              </button>
            )}
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-slate-800 bg-slate-950/50 p-4 md:p-5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
