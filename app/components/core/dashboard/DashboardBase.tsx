"use client";

import type { ReactNode } from "react";

import FooterDashboard from "@/app/components/core/dashboard/FooterDashboard";

type DashboardBaseProps = {
  children: ReactNode;
  textoRodape?: string;
};

export default function DashboardBase({
  children,
  textoRodape,
}: DashboardBaseProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {children}

        <FooterDashboard texto={textoRodape} />
      </div>
    </main>
  );
}
