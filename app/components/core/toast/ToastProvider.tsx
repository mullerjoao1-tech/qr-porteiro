"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";

import CoreToast from "./CoreToast";

import type {
  CoreToast as CoreToastData,
  CoreToastContext,
} from "./CoreToastTypes";

type ToastProviderProps = {
  children: React.ReactNode;
};

export const ToastContext =
  createContext<CoreToastContext | null>(null);

export default function ToastProvider({
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<CoreToastData[]>([]);

  const fecharToast = useCallback((id: string) => {
    setToasts((listaAtual) =>
      listaAtual.filter((toast) => toast.id !== id)
    );
  }, []);

  const mostrarToast = useCallback(
    (toast: Omit<CoreToastData, "id">) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const novoToast: CoreToastData = {
        ...toast,
        id,
        duracao: toast.duracao ?? 4000,
      };

      setToasts((listaAtual) => [
        ...listaAtual,
        novoToast,
      ]);

      window.setTimeout(() => {
        fecharToast(id);
      }, novoToast.duracao);
    },
    [fecharToast]
  );

  const valorContexto = useMemo(
    () => ({
      mostrarToast,
    }),
    [mostrarToast]
  );

  return (
    <ToastContext.Provider value={valorContexto}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[300] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <CoreToast
            key={toast.id}
            toast={toast}
            onFechar={fecharToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
