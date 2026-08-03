export type StatusCliente = "ativo" | "inativo";

export type OrigemCliente =
  | "painel"
  | "agenda"
  | "whatsapp"
  | "qr-flow"
  | "importacao";

export type ClienteBeauty = {
  id: string;
  nome: string;
  telefone: string;
  telefoneNormalizado: string;
  email?: string;
  nascimento?: string;
  observacoes?: string;

  status: StatusCliente;
  origem: OrigemCliente;

  totalVisitas: number;
  valorTotalGasto: number;
  ultimaVisita?: string;

  profissionalPreferido?: string;
  servicosPreferidos?: string[];
  tags?: string[];

  criadoEm: number;
  atualizadoEm: number;
};

export type NovoClienteBeauty = Omit<
  ClienteBeauty,
  | "id"
  | "telefoneNormalizado"
  | "totalVisitas"
  | "valorTotalGasto"
  | "criadoEm"
  | "atualizadoEm"
>;

export type AtualizacaoClienteBeauty = Partial<
  Omit<
    ClienteBeauty,
    | "id"
    | "telefoneNormalizado"
    | "criadoEm"
  >
> & {
  telefone?: string;
};

export type FiltroStatusCliente = "todos" | StatusCliente;
