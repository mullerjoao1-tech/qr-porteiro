"use client";

import { ReactNode, useEffect } from "react";

type ModalProps = {
  aberto: boolean;
  titulo?: string;
  icone?: string;
  children: ReactNode;
  footer?: ReactNode;
  tamanho?: "sm" | "md" | "lg" | "xl";
  fecharAoClicarFora?: boolean;
  onFechar: () => void;
};

export default function Modal({
  aberto,
  titulo,
  icone,
  children,
  footer,
  tamanho = "md",
  fecharAoClicarFora = true,
  onFechar,
}: ModalProps) {

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onFechar();
      }
    }

    if (aberto) {
      document.addEventListener("keydown", tecla);
    }

    return () => document.removeEventListener("keydown", tecla);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const largura = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      onClick={() => {
        if (fecharAoClicarFora) onFechar();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${largura[tamanho]} bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden`}
      >
        {(titulo || icone) && (
          <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-3">
            {icone && (
              <div className="text-3xl">
                {icone}
              </div>
            )}

            <h2 className="text-xl font-black text-white">
              {titulo}
            </h2>
          </div>
        )}

        <div className="p-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-700 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
