"use client";

import { useRouter } from "next/navigation";

import DashboardBase from "@/app/components/core/dashboard/DashboardBase";
import AcessosTemporariosResidencia from "@/app/dashboard/condominio/AcessosTemporariosResidencia";
import { useAuth } from "@/app/context/AuthContext";

export default function PaginaAcessosMorador() {
  const router =
    useRouter();

  const {
    carregando,
    vinculoSelecionadoId,
    vinculoSelecionado,
  } = useAuth();

  if (carregando) {
    return (
      <DashboardBase>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
          Carregando acessos...
        </div>
      </DashboardBase>
    );
  }

  const localId =
    vinculoSelecionado?.localId ||
    vinculoSelecionado?.condominioId ||
    vinculoSelecionadoId ||
    "";

  const localNome =
    vinculoSelecionado?.localNome ||
    vinculoSelecionado?.condominioNome ||
    "Meu local";

  if (!localId) {
    return (
      <DashboardBase>
        <div className="rounded-3xl border border-red-800 bg-red-950/30 p-6 text-red-200">
          Não foi possível identificar o local selecionado.
        </div>
      </DashboardBase>
    );
  }

  return (
    <DashboardBase>
      <AcessosTemporariosResidencia
        localId={localId}
        localNome={localNome}
        onVoltar={() =>
          router.push(
            "/dashboard/morador"
          )
        }
      />
    </DashboardBase>
  );
}
