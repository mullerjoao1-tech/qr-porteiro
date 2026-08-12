"use client";

import { useRouter } from "next/navigation";

import SeletorPerfilAtivo from "@/app/components/dashboard/SeletorPerfilAtivo";
import { useAuth } from "@/app/context/AuthContext";

export default function PaginaMeusAcessos() {
  const router = useRouter();

  const {
    usuario,
    vinculoSelecionado,
    vinculoSelecionadoId,
    logout,
  } = useAuth();

  const nomeLocal =
    vinculoSelecionado?.localNome ||
    vinculoSelecionado?.condominioNome ||
    vinculoSelecionado?.localSlug ||
    vinculoSelecionado?.condominioSlug ||
    vinculoSelecionadoId ||
    "Local";

  async function sair() {
    await logout();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-5xl p-4 md:p-8">

        <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-black text-blue-100">
                QR Core ? Meus acessos
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Ola, {usuario?.nome?.split(" ")[0] || "Usuario"}
              </h1>

              <p className="mt-2 text-blue-100">
                Escolha como deseja acessar este local.
              </p>
            </div>

            <button
              type="button"
              onClick={sair}
              className="rounded-2xl border border-red-400/50 bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500"
            >
              Sair
            </button>

          </div>

          <div className="mt-6 rounded-2xl border border-white/20 bg-black/10 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-blue-100">
              Local atual
            </p>

            <p className="mt-1 text-xl font-black">
              {nomeLocal}
            </p>
          </div>
        </section>

        <section className="mt-6">
          <SeletorPerfilAtivo />
        </section>

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-black text-slate-200 hover:bg-slate-800"
        >
          Voltar
        </button>

      </div>
    </main>
  );
}
