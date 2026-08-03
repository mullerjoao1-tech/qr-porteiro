"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import EventoImportanteModal from "./EventoImportanteModal";
import type { EventoImportanteDados } from "./EventoTypes";

type EventoContextType = {
  mostrarEvento: (evento: EventoImportanteDados) => void;
  fecharEvento: () => void;
};

const EventoContext = createContext<EventoContextType | null>(null);

export function EventoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [evento, setEvento] =
    useState<EventoImportanteDados | null>(null);

  const [flashAtivo, setFlashAtivo] =
    useState(false);

  const mostrarEvento = useCallback(
    (dados: EventoImportanteDados) => {
      setFlashAtivo(true);

      setTimeout(() => {
        setFlashAtivo(false);
        setEvento(dados);

        const tempo =
          dados.duracaoMs ?? 7000;

        setTimeout(() => {
          setEvento((atual) =>
            atual?.id === dados.id || !dados.id
              ? null
              : atual
          );
        }, tempo);
      }, 180);
    },
    []
  );

  const fecharEvento = useCallback(() => {
    setEvento(null);
    setFlashAtivo(false);
  }, []);

  const value = useMemo(
    () => ({
      mostrarEvento,
      fecharEvento,
    }),
    [mostrarEvento, fecharEvento]
  );

  return (
    <EventoContext.Provider value={value}>
      {children}

      {evento && (
        <EventoImportanteModal
          evento={evento}
          flashAtivo={flashAtivo}
          aoFechar={fecharEvento}
        />
      )}
    </EventoContext.Provider>
  );
}

export function useEventoContext() {
  const ctx = useContext(EventoContext);

  if (!ctx) {
    throw new Error(
      "useEvento deve ser usado dentro de EventoProvider."
    );
  }

  return ctx;
}
