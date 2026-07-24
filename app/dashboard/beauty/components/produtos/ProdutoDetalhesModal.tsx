"use client";

import type {
  ProdutoBeauty,
  StatusProduto,
} from "./ProdutoTypes";

interface Props {
  produto: ProdutoBeauty;
  fechar: () => void;
  alterarStatus: (
    produtoId: string,
    status: StatusProduto
  ) => Promise<void>;
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function ProdutoDetalhesModal({
  produto,
  fechar,
  alterarStatus,
}: Props) {
  async function trocarStatus() {
    await alterarStatus(
      produto.id,
      produto.status === "ativo"
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
              {produto.nome}
            </h2>

            <p className="mt-1 text-slate-400">
              {produto.categoria}
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
              Preço de venda
            </p>

            <p className="mt-1 text-xl font-black text-pink-300">
              {moeda(produto.preco)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Custo
            </p>

            <p className="mt-1 text-xl font-black text-white">
              {moeda(produto.custo)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Estoque
            </p>

            <p className="mt-1 text-xl font-black text-white">
              {produto.estoque} {produto.unidade}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Estoque mínimo
            </p>

            <p className="mt-1 text-xl font-black text-white">
              {produto.estoqueMinimo} {produto.unidade}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase text-slate-500">
              Descrição
            </p>

            <p className="mt-2 whitespace-pre-wrap text-white">
              {produto.descricao || "-"}
            </p>
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={trocarStatus}
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-black"
          >
            {produto.status === "ativo"
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
