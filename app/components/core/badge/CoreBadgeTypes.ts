export type CoreBadgeCor =
  | "slate"
  | "blue"
  | "cyan"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "violet";

export type CoreBadgeTamanho =
  | "sm"
  | "md"
  | "lg";

export type CoreBadgeProps = {
  texto: string;

  cor?: CoreBadgeCor;

  tamanho?: CoreBadgeTamanho;

  icone?: string;

  pulsar?: boolean;

  contorno?: boolean;
};
