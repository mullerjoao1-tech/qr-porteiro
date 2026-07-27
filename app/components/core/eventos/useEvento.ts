"use client";

import { useEventoContext } from "./EventoProvider";

export function useEvento() {
  return useEventoContext();
}

export default useEvento;
