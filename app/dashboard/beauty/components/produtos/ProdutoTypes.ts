export type StatusProduto = "ativo" | "inativo";

export interface ProdutoBeauty {
  id: string;
  nome: string;
  categoria: string;
  codigo?: string;
  marca?: string;
  custo: number;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
  unidade: string;
  status: StatusProduto;
  descricao?: string;
  criadoEm: number;
  atualizadoEm: number;
}

export interface NovoProdutoBeauty {
  nome: string;
  categoria: string;
  codigo?: string;
  marca?: string;
  custo: number;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
  unidade: string;
  status: StatusProduto;
  descricao?: string;
}

export type FiltroStatusProduto = "todos" | StatusProduto;
