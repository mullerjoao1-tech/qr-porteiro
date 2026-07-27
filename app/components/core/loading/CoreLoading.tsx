"use client";

import { useQRTheme } from "../provider";

import type {
  CoreLoadingProps,
  CoreLoadingTamanho,
} from "./CoreLoadingTypes";

const classesPorTamanho: Record<
  CoreLoadingTamanho,
  {
    spinner: string;
    titulo: string;
    subtitulo: string;
    espacamento: string;
  }
> = {
  sm: {
    spinner: "h-7 w-7 border-2",
    titulo: "text-sm",
    subtitulo: "text-xs",
    espacamento: "gap-3",
  },
  md: {
    spinner: "h-10 w-10 border-4",
    titulo: "text-base",
    subtitulo: "text-sm",
    espacamento: "gap-4",
  },
  lg: {
    spinner: "h-14 w-14 border-4",
    titulo: "text-xl",
    subtitulo: "text-base",
    espacamento: "gap-5",
  },
};

export default function CoreLoading({
  texto = "Carregando...",
  subtitulo,
  tamanho = "md",
  telaCheia = false,
  compacto = false,
}: CoreLoadingProps) {
  const theme = useQRTheme();
  const classes = classesPorTamanho[tamanho];

  const conteudo = (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compacto ? "py-4" : "py-8"
      } ${classes.espacamento}`}
    >
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-slate-700 border-t-white ${classes.spinner}`}
        />

        <div className="absolute inset-0 flex items-center justify-center text-sm">
          {tamanho === "lg" ? theme.icone : ""}
        </div>
      </div>

      <div>
        <p className={`font-black text-white ${classes.titulo}`}>
          {texto}
        </p>

        {subtitulo && (
          <p className={`mt-1 text-slate-400 ${classes.subtitulo}`}>
            {subtitulo}
          </p>
        )}
      </div>
    </div>
  );

  if (telaCheia) {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          {conteudo}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900">
      {conteudo}
    </div>
  );
}
