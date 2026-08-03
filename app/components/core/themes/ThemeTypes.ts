export type SegmentoQR =
  | "beauty"
  | "condominio"
  | "barber"
  | "food"
  | "pet"
  | "health"
  | "marketplace"
  | "clube";

export type QRTheme = {
  segmento: SegmentoQR;

  nome: string;

  icone: string;

  gradiente: string;

  corPrimaria: string;

  corSecundaria: string;

  corTexto: string;

  som?: string;

  logo?: string;
};