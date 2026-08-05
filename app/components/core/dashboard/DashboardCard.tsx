"use client";

import type { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  selecionado?: boolean;
};

export default function DashboardCard({
  children,
  className = "",
  selecionado = false,
}: DashboardCardProps) {
  return (
    <article
      className={[
        "rounded-3xl border p-5",
        selecionado
          ? "border-green-500 bg-green-500/10"
          : "border-slate-700 bg-slate-950",
        className,
      ].join(" ")}
    >
      {children}
    </article>
  );
}
