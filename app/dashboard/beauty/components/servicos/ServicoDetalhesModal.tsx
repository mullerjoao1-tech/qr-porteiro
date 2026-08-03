"use client";

import type {
  ServicoBeauty,
  StatusServico,
} from "./ServicoTypes";

interface Props {
  servico: ServicoBeauty;
  fechar: () => void;
  alterarStatus: (
    servicoId: string,
    status: StatusServico
  ) => Promise<void>;
}

function formatarValor(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function ServicoDetalhesModal({
  servico,
  fechar,
  alterarStatus,
}: Props) {
  async function trocarStatus() {
    await alterarStatus(
      servico.id,
      servico.status === "ativo"
        ? "inativo"
        : "ativo"
    );

    fechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">
              {servico.nome}
            </h2>

            <p className="mt-1 text-slate-400">
              {servico.categoria}
            </p>
          </div>

          <button
            onClick={fechar}
            className="rounded-lg border border-slate-700 px-3 py-2 text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Valor
            </p>

            <p className="mt-1 text-xl font-black text-pink-300">
              {formatarValor(servico.valor)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Duração
            </p>

            <p className="mt-1 text-xl font-black text-white">
              {servico.duracaoMinutos} minutos
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase text-slate-500">
              Descrição
            </p>

            <p className="mt-2 whitespace-pre-wrap text-white">
              {servico.descricao || "-"}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase text-slate-500">
              Profissionais vinculados
            </p>

            <p className="mt-2 text-white">
              {servico.profissionalIds.length}
            </p>
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={trocarStatus}
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-black"
          >
            {servico.status === "ativo"
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
