"use client";

export default function HeaderAdministradora() {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
            🏢 Central da Administradora
          </span>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            🟢 Carteira online
          </span>

          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            🧪 LAB
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-black text-slate-900">
            Administradora Muller
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500 md:text-base">
            52 condomínios • 47 operando normalmente • Atualizado às 09:18
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-black text-slate-900">
            🤖 Resumo Inteligente
          </p>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Nenhum evento crítico novo. Existem cinco tarefas aguardando ação
            da equipe. Dois contratos vencem esta semana.
          </p>
        </div>
      </div>
    </header>
  );
}