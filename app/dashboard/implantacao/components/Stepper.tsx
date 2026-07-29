"use client";

type Props = {
  passoAtual: number;
  totalPassos: number;
};

export default function Stepper({
  passoAtual,
  totalPassos,
}: Props) {
  const percentual =
    (passoAtual / totalPassos) * 100;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>
          Passo {passoAtual} de {totalPassos}
        </span>

        <span>
          {Math.round(percentual)}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{
            width: `${percentual}%`,
          }}
        />
      </div>
    </div>
  );
}