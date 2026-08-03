import type { ReactNode } from "react";
import type { SegmentoQR } from "../themes/ThemeTypes";

export type AppProviderProps = {
  segmento: SegmentoQR;

  children: ReactNode;
};