"use client";

import type { ProfissionalBeauty, StatusProfissional } from "./ProfissionalTypes";

interface Props {
  profissional: ProfissionalBeauty;
  fechar: () => void;
  alterarStatus: (
    profissionalId: string,
    status: StatusProfissional
  ) => Promise<void>;
}

export default function ProfissionalDetalhesModal({
  profissional,
  fechar,
  alterarStatus,
}: Props) {
  async function trocarStatus() {
    await alterarStatus(
      profissional.id,
      profissional.status === "ativo"
        ? "inativo"
        : "ativo"
    );
    fechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">
              {profissional.nome}
            </h2>

            <p className="mt-1 text-slate-400">
              {profissional.telefone}
            </p>
          </div>

          <button
            onClick={fechar}
            className="rounded-lg border border-slate-700 px-3 py-2 text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Email
            </p>
            <p className="text-white">
              {profissional.email || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Especialidades
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {profissional.especialidades.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-pink-600/20 px-3 py-1 text-sm text-pink-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Observações
            </p>

            <p className="text-white">
              {profissional.observacoes || "-"}
            </p>
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={trocarStatus}
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-black"
          >
            {profissional.status === "ativo"
              ? "Inativar"
              : "Ativar"}
          </button>

          <button
            onClick={fechar}
            className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
