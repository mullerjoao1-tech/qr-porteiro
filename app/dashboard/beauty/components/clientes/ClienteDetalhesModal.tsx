"use client";

import type { ClienteBeauty } from "./ClienteTypes";

type ClienteDetalhesModalProps = {
  cliente: ClienteBeauty;
  fechar: () => void;
  alterarStatus: (
    clienteId: string,
    status: "ativo" | "inativo"
  ) => Promise<void>;
};

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ClienteDetalhesModal({
  cliente,
  fechar,
  alterarStatus,
}: ClienteDetalhesModalProps) {
  const novoStatus = cliente.status === "ativo" ? "inativo" : "ativo";

  async function confirmarAlteracaoStatus() {
    try {
      await alterarStatus(cliente.id, novoStatus);
      fechar();
    } catch (erro) {
      console.error(erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível alterar o status."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 md:items-center md:p-6">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-5 md:max-w-2xl md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-pink-300">
              Cliente
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {cliente.nome}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {formatarTelefone(cliente.telefone)}
            </p>
          </div>

          <button
            type="button"
            onClick={fechar}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 font-black text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">
              Visitas
            </p>
            <p className="mt-2 text-xl font-black text-white">
              {cliente.totalVisitas}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">
              Valor gerado
            </p>
            <p className="mt-2 text-xl font-black text-white">
              {formatarValor(cliente.valorTotalGasto)}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          {cliente.email && (
            <p className="text-sm text-slate-300">
              <strong className="text-white">E-mail:</strong> {cliente.email}
            </p>
          )}

          {cliente.nascimento && (
            <p className="text-sm text-slate-300">
              <strong className="text-white">Nascimento:</strong>{" "}
              {cliente.nascimento}
            </p>
          )}

          <p className="text-sm text-slate-300">
            <strong className="text-white">Status:</strong>{" "}
            {cliente.status === "ativo" ? "Ativo" : "Inativo"}
          </p>

          <p className="text-sm text-slate-300">
            <strong className="text-white">Origem:</strong> {cliente.origem}
          </p>

          {cliente.observacoes && (
            <div className="pt-2">
              <p className="text-xs font-black uppercase text-slate-500">
                Observações
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                {cliente.observacoes}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={confirmarAlteracaoStatus}
          className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-black text-white hover:bg-slate-700"
        >
          {cliente.status === "ativo"
            ? "Inativar cliente"
            : "Reativar cliente"}
        </button>
      </div>
    </div>
  );
}
