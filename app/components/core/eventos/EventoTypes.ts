export type CorEventoImportante =
  | "pink"
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "red"
  | "cyan";

export type EventoImportanteDados = {
  id?: string;
  tipo: string;
  cor?: CorEventoImportante;
  icone: string;
  titulo: string;
  principal: string;
  subtitulo?: string;
  horario?: string;
  detalhe?: string;
  textoAcao?: string;
  duracaoMs?: number;
  aoAcionar?: () => void;
};
