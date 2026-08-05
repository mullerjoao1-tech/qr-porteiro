"use client";

import DashboardGrid from "@/app/components/core/dashboard/DashboardGrid";

type DashboardIndicadoresProps = {
  totalLocais: number;
  possuiLocalSelecionado: boolean;
  perfilAtual: string;
  ambiente?: string;
};

export default function DashboardIndicadores({
  totalLocais,
  possuiLocalSelecionado,
  perfilAtual,
  ambiente = "Studio",
}: DashboardIndicadoresProps) {
  return (
    <DashboardGrid colunas={4} className="mt-6">
      <article className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
          Locais vinculados
        </p>

        <p className="mt-3 text-4xl font-black">
          {totalLocais}
        </p>

        <p className="mt-1 text-sm text-slate-300">
          Disponíveis para este usuário
        </p>
      </article>

      <article className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-green-300">
          Contexto
        </p>

        <p className="mt-3 text-xl font-black">
          {possuiLocalSelecionado
            ? "Local selecionado"
            : "Carteira Geral"}
        </p>

        <p className="mt-1 text-sm text-slate-300">
          Permissões carregadas por vínculo
        </p>
      </article>

      <article className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-violet-300">
          Perfil
        </p>

        <p className="mt-3 text-xl font-black capitalize">
          {perfilAtual}
        </p>

        <p className="mt-1 text-sm text-slate-300">
          Acesso controlado por permissões
        </p>
      </article>

      <article className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-amber-300">
          Ambiente
        </p>

        <p className="mt-3 text-xl font-black">
          {ambiente}
        </p>

        <p className="mt-1 text-sm text-slate-300">
          Desenvolvimento e homologação
        </p>
      </article>
    </DashboardGrid>
  );
}
