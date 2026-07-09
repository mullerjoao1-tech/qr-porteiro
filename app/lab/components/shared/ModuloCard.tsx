"use client";

type ModuloCardProps = {
  titulo: string;
  valor: string | number;
  descricao: string;
  icone: string;
  detalhe?: string;
  destaque?: boolean;
};

export default function ModuloCard({
  titulo,
  valor,
  descricao,
  icone,
  detalhe,
  destaque = false,
}: ModuloCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        destaque
          ? "border-blue-200 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm font-semibold ${
              destaque ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {titulo}
          </p>

          <h3 className="mt-3 text-4xl font-black tracking-tight">{valor}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
            destaque ? "bg-white/15" : "bg-slate-100"
          }`}
        >
          {icone}
        </div>
      </div>

      <p
        className={`mt-4 text-sm leading-relaxed ${
          destaque ? "text-blue-50" : "text-slate-500"
        }`}
      >
        {descricao}
      </p>

      {detalhe && (
        <div
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            destaque
              ? "bg-white/15 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {detalhe}
        </div>
      )}
    </div>
  );
}