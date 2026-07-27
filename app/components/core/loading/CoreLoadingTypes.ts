export type CoreLoadingTamanho =
  | "sm"
  | "md"
  | "lg";

export type CoreLoadingProps = {
  texto?: string;

  subtitulo?: string;

  tamanho?: CoreLoadingTamanho;

  telaCheia?: boolean;

  compacto?: boolean;
};
