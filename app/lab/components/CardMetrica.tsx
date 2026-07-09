"use client";

type CardMetricaProps = {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone?: string;
  tendencia?: "alta" | "baixa" | "neutra";
  destaque?: boolean;
};

export default function CardMetrica({
  titulo,
  valor,
  descricao,
  icone = "📊",
  tendencia = "neutra",
  destaque = false,
}: CardMetricaProps) {
  const tendenciaTexto = {
    alta: "Tendência positiva",
    baixa: "Atenção necessária",
    neutra: "Estável",
  };

  const tendenciaClasse = {
    alta: "bg-emerald-100 text-emerald-700 border-emerald-200",
    baixa: "bg-red-100 text-red-700 border-red-200",
    neutra: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        destaque ? "border-blue-300 ring-2 ring-blue-50" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{valor}</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {icone}
        </div>
      </div>

      {descricao && (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {descricao}
        </p>
      )}

      <div
        className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tendenciaClasse[tendencia]}`}
      >
        {tendenciaTexto[tendencia]}
      </div>
    </div>
  );
}
