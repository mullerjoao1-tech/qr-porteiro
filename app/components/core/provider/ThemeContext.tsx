"use client";

import {
  createContext,
  useContext,
} from "react";

import type { QRTheme } from "../themes/ThemeTypes";

export const ThemeContext =
  createContext<QRTheme | null>(null);

export function useQRTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error(
      "useQRTheme deve ser utilizado dentro do AppProvider."
    );
  }

  return theme;
}