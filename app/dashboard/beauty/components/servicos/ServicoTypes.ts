export type StatusServico = "ativo" | "inativo";

export type FiltroStatusServico =
  | "todos"
  | StatusServico;

export interface ServicoBeauty {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  duracaoMinutos: number;
  profissionalIds: string[];
  status: StatusServico;
  corAgenda?: string;
  descricao?: string;
  criadoEm: number;
  atualizadoEm: number;
}

export interface NovoServicoBeauty {
  nome: string;
  categoria: string;
  valor: number;
  duracaoMinutos: number;
  profissionalIds: string[];
  status: StatusServico;
  corAgenda?: string;
  descricao?: string;
}
