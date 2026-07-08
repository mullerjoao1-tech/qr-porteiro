"use client";

import { ReactNode } from "react";
import Card from "./Card";
import Badge from "./Badge";

type InfoCardProps = {
  titulo: string;
  valor?: string | number;
  descricao?: string;
  icone?: string;
  badge?: string;
  badgeVariante?:
    | "primario"
    | "sucesso"
    | "perigo"
    | "aviso"
    | "info"
    | "neutro";
  footer?: ReactNode;
  onClick?: () => void;
};

export default function InfoCard({
  titulo,
  valor,
  descricao,
  icone = "ℹ️",
  badge,
  badgeVariante = "primario",
  footer,
  onClick,
}: InfoCardProps) {
  return (
    <Card
      titulo={titulo}
      icone={icone}
      clicavel={!!onClick}
      onClick={onClick}
      acao={
        badge ? (
          <Badge variante={badgeVariante}>
            {badge}
          </Badge>
        ) : undefined
      }
      rodape={footer}
    >
      {valor && (
        <h2 className="text-3xl font-black text-white mb-2">
          {valor}
        </h2>
      )}

      {descricao && (
        <p className="text-slate-400 leading-relaxed">
          {descricao}
        </p>
      )}
    </Card>
  );
}
