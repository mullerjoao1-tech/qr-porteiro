"use client";

import Link from "next/link";
import type { ModuloDashboard } from "@/app/config/dashboard";

type Props = {
  modulo: ModuloDashboard;
};

type ResumoVisual = {
  status: string;
  destaque: string;
  detalhe: string;
  alerta?: boolean;
};

const RESUMOS_VISUAIS: Record<string, ResumoVisual> = {
  dashboard: {
    status: "Visão geral",
    destaque: "8 módulos ativos",
    detalhe: "Plataforma funcionando normalmente",
  },

  "central-inteligente": {
    status: "Online",
    destaque: "3 alertas",
    detalhe: "1 item precisa de atenção",
    alerta: true,
  },

  condominio: {
    status: "Gestão ativa",
    destaque: "32 unidades",
    detalhe: "94 moradores cadastrados",
  },

  financeiro: {
    status: "Acompanhamento",
    destaque: "4 vencimentos",
    detalhe: "Contas próximas do prazo",
    alerta: true,
  },

  marketplace: {
    status: "Disponível",
    destaque: "12 oportunidades",
    detalhe: "Parceiros e serviços",
  },

  security: {
    status: "Monitoramento",
    destaque: "6 câmeras",
    detalhe: "1 dispositivo offline",
    alerta: true,
  },

  hardware: {
    status: "Integrações",
    destaque: "5 dispositivos",
    detalhe: "Câmeras, portões e controladores",
  },

  airbnb: {
    status: "Hospedagens",
    destaque: "2 reservas",
    detalhe: "Próximas entradas cadastradas",
  },
};

export default function CardModulo({ modulo }: Props) {
  const resumo = RESUMOS_VISUAIS[modulo.id];

  return (
    <Link
      href={modulo.rota}
      className="group flex min-h-64 flex-col rounded-3xl border border-slate-700 bg-slate-900 p-5 transition-all hover:-translate-y-1 hover:border-cyan-500 hover:bg-slate-800 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-3xl">
          {modulo.icone}
        </div>

        {resumo && (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${
              resumo.alerta
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-green-500/30 bg-green-500/10 text-green-300"
            }`}
          >
            {resumo.status}
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-xl font-black text-white">
          {modulo.titulo}
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          {modulo.descricao}
        </p>
      </div>

      {resumo && (
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
          <p
            className={`text-lg font-black ${
              resumo.alerta
                ? "text-amber-300"
                : "text-white"
            }`}
          >
            {resumo.destaque}
          </p>

          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {resumo.detalhe}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-5 text-sm font-black text-cyan-300">
        <span>Abrir módulo</span>

        <span className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}
