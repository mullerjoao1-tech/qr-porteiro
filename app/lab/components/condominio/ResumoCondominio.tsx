"use client";

type CardResumo = {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: string;
};

const cards: CardResumo[] = [
  {
    titulo: "Moradores",
    valor: "86",
    detalhe: "cadastrados",
    icone: "👥",
  },
  {
    titulo: "Visitantes",
    valor: "18",
    detalhe: "hoje",
    icone: "🚪",
  },
  {
    titulo: "Entregas",
    valor: "7",
    detalhe: "pendentes",
    icone: "📦",
  },
  {
    titulo: "Contratos",
    valor: "2",
    detalhe: "vencendo",
    icone: "📄",
  },
  {
    titulo: "Câmeras",
    valor: "Online",
    detalhe: "monitorando",
    icone: "📷",
  },
  {
    titulo: "Portões",
    valor: "Online",
    detalhe: "ativos",
    icone: "🚪",
  },
];

export default function ResumoCondominio() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {cards.map((card) => (
          <button
            key={card.titulo}
            type="button"
            className="flex min-w-[180px] shrink-0 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              {card.icone}
            </span>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm font-black text-slate-900">
                {card.titulo}
              </p>

              <div className="mt-1 flex items-center whitespace-nowrap">
                <strong className="text-lg font-black leading-none text-slate-950">
                  {card.valor}
                </strong>

                <span className="ml-2 text-xs font-semibold text-slate-500">
                  {card.detalhe}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}