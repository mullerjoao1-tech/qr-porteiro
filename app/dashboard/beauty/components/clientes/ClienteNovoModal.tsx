"use client";

import { useState } from "react";
import type { NovoClienteBeauty } from "./ClienteTypes";

type ClienteNovoModalProps = {
  fechar: () => void;
  salvar: (cliente: NovoClienteBeauty) => Promise<void>;
};

export default function ClienteNovoModal({
  fechar,
  salvar,
}: ClienteNovoModalProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function confirmar() {
    setSalvando(true);

    try {
      await salvar({
        nome,
        telefone,
        email: email || undefined,
        nascimento: nascimento || undefined,
        observacoes: observacoes || undefined,
        status: "ativo",
        origem: "painel",
      });

      alert("Cliente cadastrado com sucesso.");
      fechar();
    } catch (erro) {
      console.error(erro);

      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar o cliente."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 md:items-center md:p-6">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-5 md:max-w-2xl md:rounded-3xl md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-pink-300">
              QR Beauty
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Novo cliente
            </h2>
          </div>

          <button
            type="button"
            onClick={fechar}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 font-black text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-black text-slate-300">Nome</span>
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-pink-500"
              placeholder="Nome completo"
            />
          </label>

          <label>
            <span className="text-sm font-black text-slate-300">Telefone</span>
            <input
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-pink-500"
              placeholder="(41) 99999-9999"
            />
          </label>

          <label>
            <span className="text-sm font-black text-slate-300">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-pink-500"
              placeholder="cliente@email.com"
            />
          </label>

          <label>
            <span className="text-sm font-black text-slate-300">
              Data de nascimento
            </span>
            <input
              type="date"
              value={nascimento}
              onChange={(event) => setNascimento(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-pink-500"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-black text-slate-300">
              Observações
            </span>
            <textarea
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-pink-500"
              placeholder="Preferências, alergias, informações importantes..."
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={fechar}
            disabled={salvando}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-black text-slate-300"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={salvando}
            className="rounded-xl bg-pink-600 px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
