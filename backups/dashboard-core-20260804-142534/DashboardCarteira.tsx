"use client";

import type { VinculoComPermissoes } from "@/app/services/permissoes";

type LocalCarteira = [
  string,
  VinculoComPermissoes
];

type DashboardCarteiraProps = {
  locais: LocalCarteira[];
  vinculoSelecionadoId: string | null;
  onSelecionar: (vinculoId: string) => void;
  obterNomeLocal: (
    vinculoId: string,
    vinculo: VinculoComPermissoes
  ) => string;
  obterTipoLocal: (
    vinculo: VinculoComPermissoes
  ) => string;
  obterPerfil: (
    vinculo: VinculoComPermissoes
  ) => string;
  etiqueta?: string;
  titulo?: string;
};

export default function DashboardCarteira({
  locais,
  vinculoSelecionadoId,
  onSelecionar,
  obterNomeLocal,
  obterTipoLocal,
  obterPerfil,
  etiqueta = "Carteira",
  titulo = "Locais disponíveis",
}: DashboardCarteiraProps) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">
          {etiqueta}
        </p>

        <h2 className="mt-2 text-2xl font-black">
          {titulo}
        </h2>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {locais.map(([vinculoId, vinculo]) => {
          const selecionado =
            vinculoSelecionadoId === vinculoId;

          return (
            <article
              key={vinculoId}
              className={[
                "rounded-3xl border p-5",
                selecionado
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 bg-slate-950",
              ].join(" ")}
            >
              <p className="text-xs font-black uppercase tracking-wider text-green-400">
                {obterTipoLocal(vinculo)}
              </p>

              <h3 className="mt-2 text-xl font-black">
                {obterNomeLocal(vinculoId, vinculo)}
              </h3>

              <p className="mt-1 text-sm capitalize text-slate-400">
                {obterPerfil(vinculo)}
              </p>

              <button
                type="button"
                onClick={() => onSelecionar(vinculoId)}
                className={[
                  "mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black transition",
                  selecionado
                    ? "bg-green-500 text-slate-950"
                    : "border border-slate-700 bg-slate-800 text-white hover:border-green-500",
                ].join(" ")}
              >
                {selecionado
                  ? "Local selecionado"
                  : "Selecionar local"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
