"use client";

import { IndicadorAgenda } from "./AgendaTypes";

type AgendaIndicadoresProps = {
  indicadores: IndicadorAgenda[];
  valorPrevisto: string;
};

export default function AgendaIndicadores({
  indicadores,
  valorPrevisto,
}: AgendaIndicadoresProps) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {indicadores.map((item) => (
        <div
          key={item.titulo}
          className={`rounded-2xl border p-4 ${item.classes}`}
        >
          <p className="text-[10px] font-black">
            {item.titulo}
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {item.valor}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            {item.detalhe}
          </p>
        </div>
      ))}

      <div className="col-span-2 rounded-2xl border border-emerald-800 bg-emerald-950/30 p-4 text-emerald-300 xl:col-span-1">
        <p className="text-[10px] font-black">
          VALOR PREVISTO
        </p>

        <p className="mt-2 text-2xl font-black text-white">
          {valorPrevisto}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-400">
          Atendimentos ativos
        </p>
      </div>
    </section>
  );
}