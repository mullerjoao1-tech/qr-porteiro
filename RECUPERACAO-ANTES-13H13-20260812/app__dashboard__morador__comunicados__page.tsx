"use client";

import {
  Suspense,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import DashboardBase from "@/app/components/core/dashboard/DashboardBase";
import ComunicadosMorador from "@/app/components/core/morador/ComunicadosMorador";
import { useAuth } from "@/app/context/AuthContext";

function ConteudoComunicadosMorador() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    carregando,
    vinculoSelecionadoId,
    vinculoSelecionado,
  } = useAuth();

  /*
   * O link direto, inclusive o vindo do push,
   * pode informar local e unidade.
   *
   * Assim a abertura do comunicado nao depende
   * de uma tela anterior estar aberta.
   */
  const localPeloLink =
    searchParams.get("local") ||
    "";

  const unidadePeloLink =
    searchParams.get("unidade") ||
    "";

  const condominioId =
    localPeloLink ||
    vinculoSelecionado?.localId ||
    vinculoSelecionado?.condominioId ||
    vinculoSelecionadoId ||
    "";

  const unidadeCompleta =
    unidadePeloLink ||
    Object.entries(
      vinculoSelecionado?.unidades ??
      {}
    ).find(
      ([, ativo]) =>
        ativo === true
    )?.[0] ||
    "";

  const prefixoCondominio =
    `${condominioId}-`;

  const unidadeId =
    unidadeCompleta.startsWith(
      prefixoCondominio
    )
      ? unidadeCompleta.slice(
          prefixoCondominio.length
        )
      : unidadeCompleta;

  const localNome =
    vinculoSelecionado?.localNome ||
    vinculoSelecionado?.condominioNome ||
    condominioId ||
    "Condomínio";

  if (
    carregando &&
    (
      !localPeloLink ||
      !unidadePeloLink
    )
  ) {
    return (
      <DashboardBase>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
          Carregando comunicados...
        </div>
      </DashboardBase>
    );
  }

  if (
    !condominioId ||
    !unidadeId
  ) {
    return (
      <DashboardBase>
        <div className="rounded-3xl border border-red-800 bg-red-950/30 p-6 text-red-200">
          Não foi possível identificar o condomínio ou a unidade vinculada.
        </div>
      </DashboardBase>
    );
  }

  return (
    <DashboardBase>
      <ComunicadosMorador
        condominioId={condominioId}
        unidadeId={unidadeId}
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

function CarregandoPaginaComunicados() {
  return (
    <DashboardBase>
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        Carregando comunicados...
      </div>
    </DashboardBase>
  );
}

export default function PaginaComunicadosMorador() {
  return (
    <Suspense
      fallback={
        <CarregandoPaginaComunicados />
      }
    >
      <ConteudoComunicadosMorador />
    </Suspense>
  );
}