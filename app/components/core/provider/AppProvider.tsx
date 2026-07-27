"use client";

import { ThemeContext } from "./ThemeContext";
import { useTheme } from "../themes/useTheme";

import type { AppProviderProps } from "./AppProviderTypes";

export default function AppProvider({
  segmento,
  children,
}: AppProviderProps) {
  const theme = useTheme(segmento);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}