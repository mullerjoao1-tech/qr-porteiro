"use client";

import type { ProfissionalBeauty } from "./ProfissionalTypes";

interface ProfissionalCardProps {
  profissional: ProfissionalBeauty;
  onAbrir: (profissional: ProfissionalBeauty) => void;
}

function iniciaisDoNome(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  return telefone;
}

export default function ProfissionalCard({
  profissional,
  onAbrir,
}: ProfissionalCardProps) {
  const ativo = profissional.status === "ativo";

  return (
    <button
      type="button"
      onClick={() => onAbrir(profissional)}
      className="group w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-pink-500/50 hover:bg-slate-900/80 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-pink-500/20 bg-pink-500/10 text-sm font-black text-pink-300">
          {profissional.fotoUrl ? (
            <img
              src={profissional.fotoUrl}
              alt={profissional.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            iniciaisDoNome(profissional.nome)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-white">
                {profissional.nome}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {formatarTelefone(profissional.telefone)}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                ativo
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {ativo ? "Ativo" : "Inativo"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {profissional.especialidades
              .slice(0, 3)
              .map((especialidade) => (
                <span
                  key={especialidade}
                  className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-300"
                >
                  {especialidade}
                </span>
              ))}

            {profissional.especialidades.length > 3 && (
              <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-400">
                +{profissional.especialidades.length - 3}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
            <p className="text-xs font-bold text-slate-500">
              Toque para ver detalhes
            </p>

            <span className="text-lg text-pink-300 transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
