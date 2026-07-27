export type MetricCardColor =
  | "pink"
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "cyan"
  | "red"
  | "slate";

export type MetricCardProps = {
  titulo: string;
  valor: string | number;
  detalhe?: string;
  icone?: string;
  cor?: MetricCardColor;
  onClick?: () => void;
};