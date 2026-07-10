"use client";

type CorModulo =
  | "verde"
  | "amarelo"
  | "vermelho"
  | "azul"
  | "cinza";

type ModuloBaseProps = {
  icone?: string;
  titulo: string;
  valor: string;
  descricao?: string;
  status?: string;
  cor?: CorModulo;
  acao?: string;
  notificacoes?: number;
  destaque?: boolean;
  desativado?: boolean;
  onClick?: () => void;
};

const estilos = {
  verde: {
    bolinha: "bg-emerald-500",
    fundoStatus: "bg-emerald-50",
    textoStatus: "text-emerald-700",
  },

  amarelo: {
    bolinha: "bg-amber-400",
    fundoStatus: "bg-amber-50",
    textoStatus: "text-amber-700",
  },

  vermelho: {
    bolinha: "bg-red-500",
    fundoStatus: "bg-red-50",
    textoStatus: "text-red-700",
  },

  azul: {
    bolinha: "bg-blue-500",
    fundoStatus: "bg-blue-50",
    textoStatus: "text-blue-700",
  },

  cinza: {
    bolinha: "bg-slate-400",
    fundoStatus: "bg-slate-100",
    textoStatus: "text-slate-700",
  },
};

export default function ModuloBase({
  icone,
  titulo,
  valor,
  descricao,
  status,
  cor = "azul",
  acao = "Ver detalhes →",
  notificacoes,
  destaque = false,
  desativado = false,
  onClick,
}: ModuloBaseProps) {
  const estilo = estilos[cor];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      className={`group relative flex min-h-[150px] w-full flex-col rounded-3xl border p-4 text-left shadow-sm transition duration-200 ${
        destaque
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-300 bg-white text-slate-950 hover:border-blue-300"
      } ${
        desativado
          ? "cursor-not-allowed opacity-50"
          : "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icone && (
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg ${
                destaque ? "bg-white/10" : "bg-slate-100"
              }`}
            >
              {icone}
            </span>
          )}

          <h3
            className={`truncate text-sm font-black ${
              destaque ? "text-white" : "text-slate-900"
            }`}
          >
            {titulo}
          </h3>
        </div>

        {notificacoes !== undefined && notificacoes > 0 ? (
          <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-black text-white shadow-sm">
            {notificacoes}
          </span>
        ) : (
          <span
            className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
              destaque ? "border-white" : "border-slate-900"
            } ${estilo.bolinha}`}
          />
        )}
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <strong className="text-3xl font-black leading-none tracking-tight">
          {valor}
        </strong>

        {descricao && (
          <span
            className={`mb-0.5 text-xs font-semibold leading-tight ${
              destaque ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {descricao}
          </span>
        )}
      </div>

      {status && (
        <div
          className={`mt-3 flex w-fit max-w-full items-center gap-2 rounded-full px-3 py-1.5 ${
            destaque ? "bg-white/10" : estilo.fundoStatus
          }`}
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${estilo.bolinha}`}
          />

          <span
            className={`truncate text-[11px] font-black ${
              destaque ? "text-white" : estilo.textoStatus
            }`}
          >
            {status}
          </span>
        </div>
      )}

      <p
        className={`mt-auto pt-3 text-sm font-black ${
          destaque ? "text-white" : "text-blue-700"
        }`}
      >
        {desativado ? "Sem permissão" : acao}
      </p>
    </button>
  );
}