"use client";

export default function ProximaAcao() {
  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">
            🎯 Sua próxima ação
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Solar das Flores
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-700">
            Portão principal aberto há 12 minutos.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Prioridade crítica selecionada pela Central da Administradora.
          </p>
        </div>

        <button className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800">
          Resolver agora →
        </button>
      </div>
    </section>
  );
}