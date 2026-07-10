"use client";

type ItemPopup = {
  nome: string;
  descricao: string;
  horario: string;
  status?: string;
  acao?: string;
};

type CardIndicadorProps = {
  icone: string;
  titulo: string;
  valor: string;
  descricao: string;
  fundo: string;
  texto: string;
  acao: string;
  detalhes: ItemPopup[];
  aoAbrir: (dados: {
    icone: string;
    titulo: string;
    valor: string;
    descricao: string;
    texto: string;
    detalhes: ItemPopup[];
  }) => void;
};

export default function CardIndicador({
  icone,
  titulo,
  valor,
  descricao,
  fundo,
  texto,
  acao,
  detalhes,
  aoAbrir,
}: CardIndicadorProps) {
  return (
    <button
      type="button"
      onClick={() =>
        aoAbrir({
          icone,
          titulo,
          valor,
          descricao,
          texto,
          detalhes,
        })
      }
      className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-md"
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${fundo}`}
      >
        {icone}
      </div>

      <p className={`text-sm font-black ${texto}`}>{titulo}</p>

      <div className="mt-1 flex items-end gap-1">
        <strong className="text-3xl font-black text-slate-950">
          {valor}
        </strong>

        <span className="mb-1 text-xs font-bold text-slate-500">
          {descricao}
        </span>
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-wide text-blue-700">
        {acao} →
      </p>
    </button>
  );
}