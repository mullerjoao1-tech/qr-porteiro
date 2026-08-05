"use client";

type DashboardEmptyProps = {
  titulo?: string;
  descricao?: string;
  icone?: string;
};

export default function DashboardEmpty({
  titulo = "Nenhum item encontrado",
  descricao = "Não existem informações disponíveis neste momento.",
  icone = "📭",
}: DashboardEmptyProps) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
      <div className="text-4xl">
        {icone}
      </div>

      <h3 className="mt-4 text-lg font-black">
        {titulo}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {descricao}
      </p>
    </div>
  );
}
