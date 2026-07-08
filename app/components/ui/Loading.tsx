"use client";

type LoadingProps = {
  texto?: string;
  tamanho?: "sm" | "md" | "lg";
  telaInteira?: boolean;
};

export default function Loading({
  texto = "Carregando...",
  tamanho = "md",
  telaInteira = false,
}: LoadingProps) {

  const tamanhos = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-[3px]",
    lg: "w-16 h-16 border-4",
  };

  const conteudo = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${tamanhos[tamanho]}
          rounded-full
          border-slate-700
          border-t-blue-500
          animate-spin
        `}
      />

      <p className="text-slate-300 font-bold">
        {texto}
      </p>
    </div>
  );

  if (telaInteira) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center">
        {conteudo}
      </div>
    );
  }

  return (
    <div className="w-full py-8 flex items-center justify-center">
      {conteudo}
    </div>
  );
}
