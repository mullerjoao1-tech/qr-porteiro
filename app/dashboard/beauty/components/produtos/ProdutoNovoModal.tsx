"use client";

import { useState } from "react";
import type { NovoProdutoBeauty } from "./ProdutoTypes";

interface Props {
  fechar: () => void;
  salvar: (dados: NovoProdutoBeauty) => Promise<void>;
}

export default function ProdutoNovoModal({
  fechar,
  salvar,
}: Props) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [codigo, setCodigo] = useState("");
  const [custo, setCusto] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("1");
  const [unidade, setUnidade] = useState("un");
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
        marca,
        codigo,
        custo: Number(custo),
        preco: Number(preco),
        estoque: Number(estoque),
        estoqueMinimo: Number(estoqueMinimo),
        unidade,
        descricao,
        status: "ativo",
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
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-2xl font-black text-white">Novo produto</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Nome" value={nome} onChange={e=>setNome(e.target.value)} />
          <input className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Categoria" value={categoria} onChange={e=>setCategoria(e.target.value)} />
          <input className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Marca" value={marca} onChange={e=>setMarca(e.target.value)} />
          <input className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Código" value={codigo} onChange={e=>setCodigo(e.target.value)} />
          <input type="number" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Custo" value={custo} onChange={e=>setCusto(e.target.value)} />
          <input type="number" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Preço" value={preco} onChange={e=>setPreco(e.target.value)} />
          <input type="number" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Estoque" value={estoque} onChange={e=>setEstoque(e.target.value)} />
          <input type="number" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Estoque mínimo" value={estoqueMinimo} onChange={e=>setEstoqueMinimo(e.target.value)} />
          <input className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white md:col-span-2" placeholder="Unidade (un, ml, g...)" value={unidade} onChange={e=>setUnidade(e.target.value)} />
          <textarea className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white md:col-span-2" rows={4} placeholder="Descrição" value={descricao} onChange={e=>setDescricao(e.target.value)} />
        </div>

        {erro && <p className="mt-4 font-bold text-red-400">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={fechar} className="rounded-xl border border-slate-700 px-5 py-3 text-white">Cancelar</button>
          <button disabled={salvando} onClick={enviar} className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
