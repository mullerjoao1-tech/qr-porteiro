"use client";

import { CoreHero } from "@/app/components/core/hero";
import { MetricCard } from "@/app/components/core/cards";
import { useEvento } from "@/app/components/core/eventos/useEvento";

export default function CoreShowcase() {
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
      duracaoMs: 7000,
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <CoreHero
          badge="QR CORE • COMPONENTES"
          titulo="Vitrine do QR Core"
          descricao="Componentes universais usados pelo Beauty, Condomínio e futuros segmentos."
          
          botaoPrincipal={{
            texto: "💅 Testar evento Beauty",
            onClick: testarBeauty,
          }}
          botaoSecundario={{
            texto: "🏢 Testar evento Condomínio",
            onClick: testarCondominio,
          }}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            MetricCard
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Indicadores universais
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              titulo="Agendamentos"
              valor={12}
              detalhe="Hoje"
              icone="📅"
              cor="pink"
            />

            <MetricCard
              titulo="Clientes"
              valor={126}
              detalhe="Cadastrados"
              icone="👥"
              cor="blue"
            />

            <MetricCard
              titulo="Profissionais"
              valor={8}
              detalhe="Ativos"
              icone="💇"
              cor="violet"
            />

            <MetricCard
              titulo="Visitantes"
              valor={18}
              detalhe="Hoje"
              icone="🏢"
              cor="cyan"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
