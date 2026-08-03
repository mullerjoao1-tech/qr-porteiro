"use client";

import { useEffect, useMemo, useState } from "react";
import ProdutoCard from "./ProdutoCard";
import ProdutoDetalhesModal from "./ProdutoDetalhesModal";
import ProdutoFiltros from "./ProdutoFiltros";
import {
  alterarStatusProduto,
  criarProduto,
  observarProdutos,
} from "./ProdutoFirebase";
import ProdutoIndicadores from "./ProdutoIndicadores";
import ProdutoNovoModal from "./ProdutoNovoModal";
import type {
  FiltroStatusProduto,
  NovoProdutoBeauty,
  ProdutoBeauty as ProdutoBeautyType,
} from "./ProdutoTypes";

export default function ProdutoBeauty() {
  const [produtos, setProdutos] = useState<ProdutoBeautyType[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusProduto>("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [selecionado, setSelecionado] =
    useState<ProdutoBeautyType | null>(null);

  useEffect(() => {
    return observarProdutos(
      (lista) => {
        setProdutos(lista);
        setCarregando(false);
        setErro("");
      },
      (e) => {
        setErro(e.message);
        setCarregando(false);
      }
    );
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const okStatus =
        filtroStatus === "todos" ||
        produto.status === filtroStatus;

      const okBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.categoria.toLowerCase().includes(termo) ||
        (produto.marca ?? "")
          .toLowerCase()
          .includes(termo);

      return okStatus && okBusca;
    });
  }, [produtos, busca, filtroStatus]);

  const ativos = produtos.filter(
    (p) => p.status === "ativo"
  ).length;

  const inativos = produtos.filter(
    (p) => p.status === "inativo"
  ).length;

  const estoqueBaixo = produtos.filter(
    (p) => p.estoque <= p.estoqueMinimo
  ).length;

  async function salvar(
    dados: NovoProdutoBeauty
  ) {
    await criarProduto(dados);
  }

  async function alterar(
    id: string,
    status: "ativo" | "inativo"
  ) {
    await alterarStatusProduto(id, status);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-300">
          QR Beauty
        </p>

        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
          Produtos
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Controle de estoque e produtos utilizados.
        </p>
      </div>

      <ProdutoIndicadores
        total={produtos.length}
        ativos={ativos}
        inativos={inativos}
        estoqueBaixo={estoqueBaixo}
      />

      <ProdutoFiltros
        busca={busca}
        filtroStatus={filtroStatus}
        onBuscaChange={setBusca}
        onFiltroChange={setFiltroStatus}
        onNovoProduto={() => setNovoAberto(true)}
      />

      {carregando && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
          Carregando produtos...
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 text-red-300">
          {erro}
        </div>
      )}

      {!carregando && filtrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <p className="text-lg font-black text-white">
            Nenhum produto encontrado
          </p>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((produto) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            onAbrir={setSelecionado}
          />
        ))}
      </section>

      {novoAberto && (
        <ProdutoNovoModal
          fechar={() => setNovoAberto(false)}
          salvar={salvar}
        />
      )}

      {selecionado && (
        <ProdutoDetalhesModal
          produto={selecionado}
          fechar={() => setSelecionado(null)}
          alterarStatus={alterar}
        />
      )}
    </div>
  );
}
