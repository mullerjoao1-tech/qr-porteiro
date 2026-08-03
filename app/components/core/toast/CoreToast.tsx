"use client";

import type {
  CoreToast as CoreToastData,
  CoreToastTipo,
} from "./CoreToastTypes";

type CoreToastProps = {
  toast: CoreToastData;
  onFechar: (id: string) => void;
};

const classesPorTipo: Record<
  CoreToastTipo,
  {
    borda: string;
    fundo: string;
    titulo: string;
    icone: string;
  }
> = {
  success: {
    borda: "border-emerald-500/50",
    fundo: "bg-emerald-950/95",
    titulo: "text-emerald-300",
    icone: "✅",
  },
  info: {
    borda: "border-cyan-500/50",
    fundo: "bg-cyan-950/95",
    titulo: "text-cyan-300",
    icone: "ℹ️",
  },
  warning: {
    borda: "border-yellow-500/50",
    fundo: "bg-yellow-950/95",
    titulo: "text-yellow-300",
    icone: "⚠️",
  },
  error: {
    borda: "border-red-500/50",
    fundo: "bg-red-950/95",
    titulo: "text-red-300",
    icone: "❌",
  },
};

export default function CoreToast({
  toast,
  onFechar,
}: CoreToastProps) {
  const classes = classesPorTipo[toast.tipo];

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-2xl backdrop-blur ${classes.borda} ${classes.fundo}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
          {classes.icone}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`font-black ${classes.titulo}`}>
            {toast.titulo}
          </p>

          {toast.descricao && (
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {toast.descricao}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onFechar(toast.id)}
          aria-label="Fechar aviso"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-black text-slate-300 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          ×
        </button>
      </div>
    </div>
  );
}
