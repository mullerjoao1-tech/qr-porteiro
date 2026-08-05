"use client";

type DashboardLoadingProps = {
  mensagem?: string;
};

export default function DashboardLoading({
  mensagem = "Carregando painel...",
}: DashboardLoadingProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

        <p className="mt-4 text-sm font-bold text-slate-300">
          {mensagem}
        </p>
      </div>
    </main>
  );
}
