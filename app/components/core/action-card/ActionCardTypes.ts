import { ReactNode } from "react";

export type ActionCardColor =
  | "pink"
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "cyan"
  | "red";

export type ActionCardProps = {
  titulo: string;

  descricao?: string;

  icone?: string;

  cor?: ActionCardColor;

  badge?: string;

  destaque?: string;

  onClick?: () => void;

  footer?: ReactNode;

  children?: ReactNode;
};