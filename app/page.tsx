"use client";

import Link from "next/link";

export default function Home() {
  const moradores = [
    { nome: "Morador 1", link: "/painel1" },
    { nome: "Morador 2", link: "/painel2" },
    { nome: "Morador 3", link: "/painel3" },
    { nome: "Morador 4", link: "/painel4" },
    { nome: "Morador 5", link: "/painel5" },
  ];

  const visitantes = [
    { nome: "QR 1", link: "/qr1" },
    { nome: "QR 2", link: "/qr2" },
    { nome: "QR 3", link: "/qr3" },
    { nome: "QR 4", link: "/qr4" },
    { nome: "QR 5", link: "/qr5" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center mb-4">
            <span className="text-slate-950 font-black text-3xl">QR</span>
          </div>

          <h1 className="text-4xl font-black">QR Acesso</h1>

          <p className="text-slate-400 mt-2">
            Controle inteligente de acesso
          </p>

          <p className="text-xs text-green-400 mt-3">
            Campainha virtual • Atendimento remoto • Segurança
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 mb-5">
          <h2 className="text-xl font-bold mb-3">🏠 Moradores</h2>

          <div className="space-y-3">
            {moradores.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className="block w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-center py-3 rounded-xl transition-all"
              >
                {item.nome}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-3">📱 Visitantes</h2>

          <div className="space-y-3">
            {visitantes.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-center py-3 rounded-xl transition-all"
              >
                {item.nome}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Beta 1 • QR Acesso
        </p>
      </div>
    </main>
  );
}