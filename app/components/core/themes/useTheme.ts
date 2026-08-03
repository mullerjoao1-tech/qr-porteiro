import beautyTheme from "./beauty";
import condominioTheme from "./condominio";

import type {
  QRTheme,
  SegmentoQR,
} from "./ThemeTypes";

const themes: Partial<Record<SegmentoQR, QRTheme>> = {
  beauty: beautyTheme,
  condominio: condominioTheme,
};

export function useTheme(
  segmento: SegmentoQR
): QRTheme {
  const theme = themes[segmento];

  if (!theme) {
    throw new Error(
      `Tema "${segmento}" não encontrado.`
    );
  }

  return theme;
}