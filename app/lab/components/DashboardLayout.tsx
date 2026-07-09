"use client";

import React from "react";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                QR Acesso V2
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">
                Sprint 3 — Central Inteligente
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
                Ambiente LAB para testar a nova Central de Gestão sem arriscar
                o sistema em produção.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              🧪 Tudo novo nasce no LAB
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
