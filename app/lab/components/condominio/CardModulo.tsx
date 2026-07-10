"use client";

type StatusModulo = "verde" | "amarelo" | "vermelho" | "azul";

type CardModuloProps = {
  icone: string;
  titulo: string;
  resumo: string;
  status: StatusModulo;
  notificacoes?: number;
  onClick?: () => void;
};

const estilosStatus: Record<
  StatusModulo,
  {
    bolinha: string;
    fundo: string;
    texto: string;
    legenda: string;
  }
> = {
  verde: {
    bolinha: "bg-emerald-500",
    fundo: "bg-emerald-50",
    texto: "text-emerald-700",
    legenda: "Tudo certo",
  },
  amarelo: {
    bolinha: "bg-amber-400",
    fundo: "bg-amber-50",
    texto: "text-amber-700",
    legenda: "Acompanhar",
  },
  vermelho: {
    bolinha: "bg-red-500",
    fundo: "bg-red-50",
    texto: "text-red-700",
    legenda: "Atenção",
  },
  azul: {
    bolinha: "bg-blue-500",
    fundo: "bg-blue-50",
    texto: "text-blue-700",
    legenda: "Informação",
  },
};

export default function CardModulo({
  icone,
  titulo,
  resumo,
  status,
  notificacoes,
  onClick,
}: CardModuloProps) {
  const estilo = estilosStatus[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[150px] w-full flex-col rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
          {icone}
        </div>

        {notificacoes !== undefined && notificacoes > 0 ? (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-black text-white shadow-sm">
            {notificacoes}
          </span>
        ) : (
          <span
            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${estilo.bolinha}`}
          />
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-black leading-tight text-slate-900">
          {titulo}
        </h3>

        <p className="mt-1 text-xl font-black leading-tight text-slate-950">
          {resumo}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div
          className={`flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 ${estilo.fundo}`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${estilo.bolinha}`}
          />

          <span
            className={`truncate text-[10px] font-black ${estilo.texto}`}
          >
            {estilo.legenda}
          </span>
        </div>

        <span className="shrink-0 text-lg font-black text-blue-700 transition group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>
  );
}