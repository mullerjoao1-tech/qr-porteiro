import { ReactNode } from "react";

export type CoreTableColumn<T = unknown> = {
  id: string;

  titulo: string;

  largura?: string;

  alinhamento?: "left" | "center" | "right";

  render: (item: T) => ReactNode;
};

export type CoreTableProps<T = unknown> = {
  titulo?: string;

  subtitulo?: string;

  colunas: CoreTableColumn<T>[];

  dados: T[];

  vazioTitulo?: string;

  vazioDescricao?: string;

  onLinhaClick?: (item: T) => void;
};