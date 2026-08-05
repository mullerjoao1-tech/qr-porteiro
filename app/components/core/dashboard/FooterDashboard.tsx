"use client";

type FooterDashboardProps = {
  texto?: string;
};

export default function FooterDashboard({
  texto = "QR Acesso Studio • Dashboard modular do QR Core",
}: FooterDashboardProps) {
  return (
    <footer className="mt-8 text-center text-xs text-slate-600">
      {texto}
    </footer>
  );
}
