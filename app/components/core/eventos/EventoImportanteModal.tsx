"use client";

import type { EventoImportanteDados } from "./EventoTypes";

type EventoImportanteModalProps = {
  evento: EventoImportanteDados;
  flashAtivo: boolean;
  aoFechar: () => void;
};

const classesPorCor = {
  pink: {
    borda: "border-pink-400",
    icone: "border-pink-400/30 bg-pink-500/15 shadow-pink-500/20",
    destaque: "text-pink-300",
    botao:
      "bg-pink-600 hover:bg-pink-500 shadow-pink-950/30",
  },
  blue: {
    borda: "border-blue-400",
    icone: "border-blue-400/30 bg-blue-500/15 shadow-blue-500/20",
    destaque: "text-blue-300",
    botao:
      "bg-blue-600 hover:bg-blue-500 shadow-blue-950/30",
  },
  green: {
    borda: "border-emerald-400",
    icone:
      "border-emerald-400/30 bg-emerald-500/15 shadow-emerald-500/20",
    destaque: "text-emerald-300",
    botao:
      "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30",
  },
  orange: {
    borda: "border-orange-400",
    icone:
      "border-orange-400/30 bg-orange-500/15 shadow-orange-500/20",
    destaque: "text-orange-300",
    botao:
      "bg-orange-600 hover:bg-orange-500 shadow-orange-950/30",
  },
  violet: {
    borda: "border-violet-400",
    icone:
      "border-violet-400/30 bg-violet-500/15 shadow-violet-500/20",
    destaque: "text-violet-300",
    botao:
      "bg-violet-600 hover:bg-violet-500 shadow-violet-950/30",
  },
  red: {
    borda: "border-red-400",
    icone: "border-red-400/30 bg-red-500/15 shadow-red-500/20",
    destaque: "text-red-300",
    botao:
      "bg-red-600 hover:bg-red-500 shadow-red-950/30",
  },
  cyan: {
    borda: "border-cyan-400",
    icone:
      "border-cyan-400/30 bg-cyan-500/15 shadow-cyan-500/20",
    destaque: "text-cyan-300",
    botao:
      "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/30",
  },
} as const;

export default function EventoImportanteModal({
  evento,
  flashAtivo,
  aoFechar,
}: EventoImportanteModalProps) {
  const cor = classesPorCor[evento.cor ?? "green"];

  return (
    <>
      {flashAtivo && (
        <div className="pointer-events-none fixed inset-0 z-[119] bg-pink-500/30 mix-blend-screen" />
      )}

      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
        <div
          className={`relative w-full max-w-xl animate-[pulse_0.45s_ease-in-out_1] rounded-[2rem] border ${cor.borda} bg-slate-900 p-7 text-center shadow-2xl shadow-black/60 md:p-9`}
        >
          <button
            type="button"
            onClick={aoFechar}
            className="absolute right-5 top-5 rounded-xl bg-slate-800 px-3 py-2 text-sm font-black text-slate-300 transition-all hover:bg-slate-700"
            aria-label="Fechar aviso"
          >
            ×
          </button>

          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border text-5xl shadow-lg ${cor.icone}`}
          >
            {evento.icone}
          </div>

          <p
            className={`mt-6 text-xs font-black uppercase tracking-[0.22em] ${cor.destaque}`}
          >
            {evento.titulo}
          </p>

          <h3 className="mt-3 break-words text-4xl font-black leading-tight text-white md:text-5xl">
            {evento.principal}
          </h3>

          {evento.detalhe && (
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-300 md:text-base">
              {evento.detalhe}
            </p>
          )}

          {(evento.subtitulo || evento.horario) && (
            <div className="mt-7 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              {evento.subtitulo && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Detalhes
                  </p>

                  <p className="mt-2 text-lg font-black text-white">
                    {evento.subtitulo}
                  </p>
                </div>
              )}

              {evento.horario && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Horário
                  </p>

                  <p
                    className={`mt-2 text-3xl font-black ${cor.destaque}`}
                  >
                    {evento.horario}
                  </p>
                </div>
              )}
            </div>
          )}

          {evento.aoAcionar && (
            <button
              type="button"
              onClick={evento.aoAcionar}
              className={`mt-7 w-full rounded-2xl px-5 py-4 text-lg font-black text-white shadow-lg transition-all active:scale-[0.98] ${cor.botao}`}
            >
              ➜ {evento.textoAcao ?? "Abrir"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
