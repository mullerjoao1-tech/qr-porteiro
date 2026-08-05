"use client";

import DashboardCard from "@/app/components/core/dashboard/DashboardCard";
import DashboardEmpty from "@/app/components/core/dashboard/DashboardEmpty";
import DashboardGrid from "@/app/components/core/dashboard/DashboardGrid";
import DashboardSection from "@/app/components/core/dashboard/DashboardSection";

import type { VinculoComPermissoes } from "@/app/services/permissoes";

type LocalCarteira = [
  string,
  VinculoComPermissoes
];

type DashboardCarteiraProps = {
  locais: LocalCarteira[];
  vinculoSelecionadoId: string | null;
  onSelecionar: (vinculoId: string) => void;
  obterNomeLocal: (
    vinculoId: string,
    vinculo: VinculoComPermissoes
  ) => string;
  obterTipoLocal: (
    vinculo: VinculoComPermissoes
  ) => string;
  obterPerfil: (
    vinculo: VinculoComPermissoes
  ) => string;
  etiqueta?: string;
  titulo?: string;
};

export default function DashboardCarteira({
  locais,
  vinculoSelecionadoId,
  onSelecionar,
  obterNomeLocal,
  obterTipoLocal,
  obterPerfil,
  etiqueta = "Carteira",
  titulo = "Locais disponíveis",
}: DashboardCarteiraProps) {
  return (
    <DashboardSection
      etiqueta={etiqueta}
      titulo={titulo}
      corEtiqueta="text-green-400"
    >
      {locais.length === 0 ? (
        <DashboardEmpty
          titulo="Nenhum local disponível"
          descricao="Este usuário ainda não possui vínculos ativos."
          icone="🏢"
        />
      ) : (
        <DashboardGrid colunas={3} className="mt-6">
          {locais.map(([vinculoId, vinculo]) => {
            const selecionado =
              vinculoSelecionadoId === vinculoId;

            return (
              <DashboardCard
                key={vinculoId}
                selecionado={selecionado}
              >
                <p className="text-xs font-black uppercase tracking-wider text-green-400">
                  {obterTipoLocal(vinculo)}
                </p>

                <h3 className="mt-2 text-xl font-black">
                  {obterNomeLocal(vinculoId, vinculo)}
                </h3>

                <p className="mt-1 text-sm capitalize text-slate-400">
                  {obterPerfil(vinculo)}
                </p>

                <button
                  type="button"
                  onClick={() => onSelecionar(vinculoId)}
                  className={[
                    "mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black transition",
                    selecionado
                      ? "bg-green-500 text-slate-950"
                      : "border border-slate-700 bg-slate-800 text-white hover:border-green-500",
                  ].join(" ")}
                >
                  {selecionado
                    ? "Local selecionado"
                    : "Selecionar local"}
                </button>
              </DashboardCard>
            );
          })}
        </DashboardGrid>
      )}
    </DashboardSection>
  );
}
