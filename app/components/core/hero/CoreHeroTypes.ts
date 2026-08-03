import { ReactNode } from "react";

export type CoreHeroProps = {
  badge?: string;

  titulo: string;

  descricao?: string;

  botaoPrincipal?: {
    texto: string;
    onClick: () => void;
  };

  botaoSecundario?: {
    texto: string;
    onClick: () => void;
  };

  extra?: ReactNode;
};