"use client";

export default function HeaderSindico() {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              👔 Painel do Síndico
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              🟢 Online
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              🧪 LAB
            </span>
          </div>

         <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
  Bom dia, João.
</h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500 md:text-base">
            <span className="font-bold">
  Condomínio Tulipas
</span>

{" • "}

Terça-feira, 08 de julho de 2026
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50">
            🔔
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50">
            ⚙️
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50">
            👤
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Operação normal.
        </p>

        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          2 pequenas pendências aguardam revisão.
        </p>
      </div>
    </header>
  );
}