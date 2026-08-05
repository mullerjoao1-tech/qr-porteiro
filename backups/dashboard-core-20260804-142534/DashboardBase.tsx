"use client";

import type { ReactNode } from "react";

type DashboardBaseProps = {
  children: ReactNode;
  textoRodape?: string;
};

export default function DashboardBase({
  children,
  textoRodape = "QR Acesso Studio • Dashboard modular do QR Core",
}: DashboardBaseProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {children}

        <footer className="mt-8 text-center text-xs text-slate-600">
          {textoRodape}
        </footer>
      </div>
    </main>
  );
}
