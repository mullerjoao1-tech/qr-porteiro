"use client";

type Unidade = {
  id: string;
  nome: string;
  slug: string;
  condominio?: string;
  bloco?: string;
  apartamento?: string;
};

type Props = {
  aberto: boolean;
  unidades: Unidade[];
  onFechar: () => void;
  onSelecionar: (unidade: Unidade) => void;
};

export default function ModalSelecionarUnidade({
  aberto,
  unidades,
  onFechar,
  onSelecionar,
}: Props) {
  if (!aberto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={onFechar}
    >
      <section
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-violet-500/40 bg-slate-950 shadow-2xl"
        onMouseDown={(evento) =>
          evento.stopPropagation()
        }
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-400">
              👤 Perfil Morador
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Escolha a unidade
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Você possui acesso a mais de uma unidade neste local.
            </p>

            <p className="mt-2 text-sm font-black text-violet-300">
              {unidades.length} unidades disponíveis
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-xl font-black text-slate-300 hover:bg-slate-800"
          >
            ×
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {unidades.map((unidade) => (
              <button
                key={unidade.id}
                type="button"
                onClick={() =>
                  onSelecionar(unidade)
                }
                className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left transition hover:border-violet-500 hover:bg-slate-800 active:scale-[0.99]"
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-violet-400">
                  Unidade
                </p>

                <h3 className="mt-1 text-xl font-black text-white">
                  🏢 {unidade.condominio}
                </h3>

                <div className="mt-4 space-y-1">
                  <p className="text-base font-black text-slate-200">
                    Bloco {unidade.bloco}
                  </p>

                  <p className="text-base text-slate-400">
                    Apartamento {unidade.apartamento}
                  </p>
                </div>

                <div className="mt-5">
                  <span className="inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">
                    Entrar →
                  </span>
                </div>
              </button>
            ))}
          </div>

          {unidades.length === 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
              <p className="font-black text-amber-300">
                Nenhuma unidade vinculada.
              </p>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-800 p-5">
          <button
            type="button"
            onClick={onFechar}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-black text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
        </footer>
      </section>
    </div>
  );
}



