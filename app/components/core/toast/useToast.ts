"use client";

import { useContext } from "react";

import { ToastContext } from "./ToastProvider";

export function useToast() {
  const contexto = useContext(ToastContext);

  if (!contexto) {
    throw new Error(
      "useToast deve ser utilizado dentro do ToastProvider."
    );
  }

  return contexto;
}