"use client";

type HeaderDashboardProps = {
  subtitulo: string;
  nomeUsuario: string;
  descricao: string;
  nomeContexto: string;
  contextoLocalSelecionado: boolean;
  tipoLocal?: string;
  perfil?: string;
  onSelecionarCarteiraGeral: () => void;
  onTrocarContexto: () => void;
};

export default function HeaderDashboard({
  subtitulo,
  nomeUsuario,
  descricao,
  nomeContexto,
  contextoLocalSelecionado,
  tipoLocal,
  perfil,
  onSelecionarCarteiraGeral,
  onTrocarContexto,
}: HeaderDashboardProps) {
  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
            {subtitulo}
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Bom dia, {nomeUsuario}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {descricao}
          </p>
        </div>

        <div className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 lg:max-w-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Contexto atual
          </p>

          <p className="mt-2 text-lg font-black text-cyan-300">
            {contextoLocalSelecionado ? "🏢 " : "🌐 "}
            {nomeContexto}
          </p>

          {contextoLocalSelecionado && tipoLocal && perfil && (
            <p className="mt-1 text-xs font-semibold capitalize text-slate-400">
              {tipoLocal} • {perfil}
            </p>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onSelecionarCarteiraGeral}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-black text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Carteira Geral
            </button>

            <button
              type="button"
              onClick={onTrocarContexto}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-slate-700"
            >
              Trocar contexto
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
