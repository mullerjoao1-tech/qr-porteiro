"use client";

import { useState } from "react";
import type { NovoServicoBeauty } from "./ServicoTypes";

interface Props {
  fechar: () => void;
  salvar: (dados: NovoServicoBeauty) => Promise<void>;
}

export default function ServicoNovoModal({
  fechar,
  salvar,
}: Props) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [duracao, setDuracao] = useState("60");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    try {
      setErro("");
      setSalvando(true);

      await salvar({
        nome,
        categoria,
        valor: Number(valor),
        duracaoMinutos: Number(duracao),
        profissionalIds: [],
        status: "ativo",
        descricao,
      });

      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-2xl font-black text-white">
          Novo serviço
        </h2>

        <div className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            placeholder="Nome do serviço"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />

          <input
            type="number"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />

          <input
            type="number"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            placeholder="Duração (minutos)"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
          />

          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            rows={4}
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        {erro && (
          <p className="mt-4 font-bold text-red-400">
            {erro}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={fechar}
            className="rounded-xl border border-slate-700 px-5 py-3 text-white"
          >
            Cancelar
          </button>

          <button
            disabled={salvando}
            onClick={enviar}
            className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
