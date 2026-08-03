export type StatusProfissional = "ativo" | "inativo";

export type FiltroStatusProfissional =
  | "todos"
  | StatusProfissional;

export interface JornadaProfissional {
  dia:
    | "segunda"
    | "terca"
    | "quarta"
    | "quinta"
    | "sexta"
    | "sabado"
    | "domingo";
  ativo: boolean;
  inicio: string;
  fim: string;
}

export interface ProfissionalBeauty {
  id: string;
  nome: string;
  telefone: string;
  telefoneNormalizado: string;
  email?: string;
  fotoUrl?: string;
  especialidades: string[];
  status: StatusProfissional;
  corAgenda?: string;
  observacoes?: string;
  jornada?: JornadaProfissional[];
  criadoEm: number;
  atualizadoEm: number;
}

export interface NovoProfissionalBeauty {
  nome: string;
  telefone: string;
  email?: string;
  fotoUrl?: string;
  especialidades: string[];
  status: StatusProfissional;
  corAgenda?: string;
  observacoes?: string;
  jornada?: JornadaProfissional[];
}
