"use client";

import { useEvento } from "@/app/components/core/eventos/useEvento";

export default function TesteEventoCorePage() {
  const { mostrarEvento } = useEvento();

  function testarBeauty() {
    mostrarEvento({
      id: `beauty-${Date.now()}`,
      tipo: "novo-agendamento",
      cor: "pink",
      icone: "💅",
      titulo: "Novo agendamento",
      principal: "Maria Fernanda",
      subtitulo: "Manicure completa",
      horario: "15:30",
      detalhe: "Seu próximo atendimento chegou.",
      textoAcao: "Abrir atendimento",
      duracaoMs: 7000,
      aoAcionar: () => {
        window.location.href = "/dashboard/beauty";
      },
    });
  }

  function testarCondominio() {
    mostrarEvento({
      id: `condominio-${Date.now()}`,
      tipo: "visitante-chegou",
      cor: "cyan",
      icone: "🏢",
      titulo: "Visitante chegou",
      principal: "João Silva",
      subtitulo: "Bloco 1 • Apartamento 203",
      horario: "14:22",
      detalhe: "Uma nova solicitação de acesso está aguardando.",
      textoAcao: "Abrir atendimento",
      duracaoMs: 7000,
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-lg">
        <section className="rounded-3xl border border-violet-500/30 bg-slate-900 p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            QR CORE
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Teste de eventos
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Esta tela testa o mesmo modal em segmentos diferentes,
            sem copiar o componente.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={testarBeauty}
              className="w-full rounded-2xl bg-pink-600 px-5 py-4 text-lg font-black transition active:scale-[0.98]"
            >
              💅 Testar evento Beauty
            </button>

            <button
              type="button"
              onClick={testarCondominio}
              className="w-full rounded-2xl bg-cyan-600 px-5 py-4 text-lg font-black transition active:scale-[0.98]"
            >
              🏢 Testar evento Condomínio
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
