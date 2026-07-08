"use client";

import { ReactNode } from "react";
import Botao from "./Botao";

type EmptyStateProps = {
  titulo?: string;
  descricao?: string;
  icone?: string;
  textoBotao?: string;
  onAcao?: () => void;
  children?: ReactNode;
};

export default function EmptyState({
  titulo = "Nada encontrado",
  descricao = "Ainda não existem informações para exibir.",
  icone = "📭",
  textoBotao,
  onAcao,
  children,
}: EmptyStateProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center shadow-xl">

      <div className="text-6xl mb-4">
        {icone}
      </div>

      <h2 className="text-2xl font-black text-white">
        {titulo}
      </h2>

      <p className="text-slate-400 mt-3 max-w-md mx-auto">
        {descricao}
      </p>

      {children && (
        <div className="mt-5">
          {children}
        </div>
      )}

      {textoBotao && onAcao && (
        <div className="mt-6 max-w-xs mx-auto">
          <Botao
            variante="primario"
            icone="➕"
            onClick={onAcao}
          >
            {textoBotao}
          </Botao>
        </div>
      )}
    </div>
  );
}
