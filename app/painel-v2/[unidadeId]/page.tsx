"use client";

import HeaderPainel from "../../components/painel/HeaderPainel";
import KPIsPainel from "../../components/painel/KPIsPainel";
import FiltrosPainel from "../../components/painel/FiltrosPainel";
import GridUnidades from "../../components/painel/GridUnidades";
import PopupUnidade from "../../components/painel/PopupUnidade";

import { usePainel } from "../../hooks/usePainel";

export default function PainelV2Central() {
  const {
    unidades,
    unidadesFiltradas,
    carregando,

    filtro,
    setFiltro,

    unidadeAberta,
    setUnidadeAberta,

    totalChamando,
    totalAtendimento,
    totalLivres,

    criarChamadaTeste,
    atenderChamada,
    enviarMensagem,
    finalizarChamada,
  } = usePainel();

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      <div className="w-full max-w-7xl mx-auto">
        <HeaderPainel />

        <KPIsPainel
          totalUnidades={unidades.length}
          totalChamando={totalChamando}
          totalAtendimento={totalAtendimento}
          totalLivres={totalLivres}
        />

        <FiltrosPainel
          filtro={filtro}
          aoAlterarFiltro={setFiltro}
        />

        <GridUnidades
          unidades={unidadesFiltradas}
          carregando={carregando}
          aoAbrirUnidade={setUnidadeAberta}
        />
      </div>

      <PopupUnidade
        unidade={unidadeAberta}
        aoFechar={() => setUnidadeAberta(null)}
        aoAtender={atenderChamada}
        aoEnviarMensagem={enviarMensagem}
        aoFinalizar={finalizarChamada}
        aoCriarTeste={criarChamadaTeste}
      />
    </main>
  );
}