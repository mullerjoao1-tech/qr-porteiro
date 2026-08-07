import Link from "next/link";

import SeletorPerfilAtivo from "@/app/components/dashboard/SeletorPerfilAtivo";

export default function PaginaCentralInteligente() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-fuchsia-500/30 bg-slate-900 p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-400">
            🧠 QR Core • Central Inteligente
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Central Inteligente
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Alertas, ocorrências, prioridades, automações e acompanhamento
            operacional do contexto selecionado.
          </p>

          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-slate-700"
            >
              ← Trocar contexto
            </Link>
          </div>
        </header>

        <SeletorPerfilAtivo />

        <section className="rounded-3xl border border-fuchsia-500/20 bg-slate-900 p-7">
          <p className="text-xs font-black uppercase tracking-wider text-fuchsia-400">
            Central do QR Core
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Estrutura preparada
          </h2>

          <p className="mt-2 text-slate-400">
            A rota da Central Inteligente já está integrada ao Login Único e
            ao perfil ativo. Os recursos operacionais serão conectados a partir
            desta base.
          </p>
        </section>
      </div>
    </main>
  );
}
