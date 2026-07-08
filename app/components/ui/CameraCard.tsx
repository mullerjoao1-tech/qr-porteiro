"use client";

import { ReactNode } from "react";
import Botao from "./Botao";

type CameraCardProps = {
  imagem?: string;
  titulo?: string;
  atualizadoEm?: string;
  carregando?: boolean;
  onAtualizar?: () => void;
  onExpandir?: () => void;
  footer?: ReactNode;
};

export default function CameraCard({
  imagem,
  titulo = "Câmera",
  atualizadoEm,
  carregando = false,
  onAtualizar,
  onExpandir,
  footer,
}: CameraCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-xl">

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
          📷
        </div>

        <div>
          <h3 className="text-lg font-black text-white">
            {titulo}
          </h3>

          {atualizadoEm && (
            <p className="text-xs text-slate-400">
              Atualizado: {atualizadoEm}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 min-h-[180px] flex items-center justify-center">
        {imagem ? (
          <img
            src={imagem}
            alt="Camera"
            className="w-full object-cover"
          />
        ) : (
          <div className="text-center text-slate-400 p-8">
            <div className="text-5xl mb-3">📷</div>
            <p>Nenhuma imagem disponível</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">

        <Botao
          variante="secundario"
          icone="🔄"
          carregando={carregando}
          onClick={onAtualizar}
        >
          Atualizar
        </Botao>

        <Botao
          variante="primario"
          icone="🔍"
          onClick={onExpandir}
        >
          Expandir
        </Botao>

      </div>

      {footer && (
        <div className="mt-4 border-t border-slate-700 pt-3">
          {footer}
        </div>
      )}

    </div>
  );
}
