"use client";

import type { ReactNode } from "react";

type ColunasDashboard = 1 | 2 | 3 | 4;

type DashboardGridProps = {
  children: ReactNode;
  colunas?: ColunasDashboard;
  className?: string;
};

const CLASSES_COLUNAS: Record<ColunasDashboard, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export default function DashboardGrid({
  children,
  colunas = 3,
  className = "",
}: DashboardGridProps) {
  return (
    <div
      className={[
        "grid gap-4",
        CLASSES_COLUNAS[colunas],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
