import type { ReactNode } from "react";

export type CoreModalTamanho =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "full";

export type CoreModalProps = {
  aberto: boolean;

  titulo?: string;

  subtitulo?: string;

  icone?: string;

  tamanho?: CoreModalTamanho;

  children: ReactNode;

  footer?: ReactNode;

  fecharAoClicarFora?: boolean;

  fecharComEsc?: boolean;

  mostrarBotaoFechar?: boolean;

  onFechar: () => void;
};
