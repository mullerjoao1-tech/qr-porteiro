"use client";

import { ReactNode } from "react";

export type TimelineItem = {
  id?: string | number;
  titulo: string;
  descricao?: string;
  horario?: string;
  icone?: string;
  status?: "padrao" | "sucesso" | "aviso" | "perigo" | "info";
  extra?: ReactNode;
};

type TimelineProps = {
  itens: TimelineItem[];
  vazioTitulo?: string;
  vazioDescricao?: string;
};

export default function Timeline({
  itens,
  vazioTitulo = "Nenhum evento registrado",
  vazioDescricao = "Quando algo acontecer, a linha do tempo aparecerá aqui.",
}: TimelineProps) {
  const cores = {
    padrao: "bg-slate-700 border-slate-600 text-slate-200",
    sucesso: "bg-green-500/20 border-green-500/50 text-green-300",
    aviso: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
    perigo: "bg-red-500/20 border-red-500/50 text-red-300",
    info: "bg-blue-500/20 border-blue-500/50 text-blue-300",
  };

  if (!itens || itens.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center">
        <div className="text-5xl mb-3">📋</div>
        <h3 className="text-white font-black text-xl">{vazioTitulo}</h3>
        <p className="text-slate-400 text-sm mt-2">{vazioDescricao}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-xl">
      <div className="space-y-0">
        {itens.map((item, index) => {
          const status = item.status || "padrao";
          const ultimo = index === itens.length - 1;

          return (
            <div key={item.id || index} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0
                    ${cores[status]}
                  `}
                >
                  {item.icone || "•"}
                </div>

                {!ultimo && (
                  <div className="w-px flex-1 min-h-8 bg-slate-700 my-1" />
                )}
              </div>

              <div className={ultimo ? "pb-1 flex-1" : "pb-5 flex-1"}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white font-black leading-tight">
                      {item.titulo}
                    </h3>

                    {item.descricao && (
                      <p className="text-slate-400 text-sm mt-1 leading-snug">
                        {item.descricao}
                      </p>
                    )}
                  </div>

                  {item.horario && (
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {item.horario}
                    </span>
                  )}
                </div>

                {item.extra && (
                  <div className="mt-3">
                    {item.extra}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
