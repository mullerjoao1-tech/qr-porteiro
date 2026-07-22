"use client";

import Link from "next/link";

const modulosPrincipais = [
  {
    titulo: "🚪 Acesso V2",
    descricao: "Entrada do visitante pelo QR Code único do condomínio.",
    link: "/acesso-v2/cnd-tulipas",
    classe:
      "border-blue-500/30 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-500/20",
  },
  {
    titulo: "👤 Morador V2",
    descricao: "Painel de atendimento e comunicação do morador.",
    link: "/morador-v2/bloco-1-ap-11",
    classe:
      "border-green-500/30 bg-green-500/10 hover:border-green-400 hover:bg-green-500/20",
  },
  {
    titulo: "🏢 Painel Central",
    descricao: "Monitoramento dos chamados, unidades e atendimentos.",
    link: "/painel-v2",
    classe:
      "border-purple-500/30 bg-purple-500/10 hover:border-purple-400 hover:bg-purple-500/20",
  },
  {
    titulo: "⚙️ Hardware Manager",
    descricao:
      "Câmeras, portões, BLE, Tuya, ESP32 e diagnósticos de integração.",
    link: "/hardware",
    classe:
      "border-orange-500/30 bg-orange-500/10 hover:border-orange-400 hover:bg-orange-500/20",
  },
];

const ferramentasStudio = [
  {
    titulo: "📷 Teste de câmera",
    link: "/teste-camera",
  },
  {
    titulo: "🔵 Teste BLE",
    link: "/teste-ble",
  },
  {
    titulo: "🔐 Teste de acesso",
    link: "/teste-access",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-green-500">
              <span className="text-3xl font-black text-slate-950">QR</span>
            </div>

            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-green-400">
                Ambiente de desenvolvimento
              </p>

              <h1 className="text-3xl font-black sm:text-4xl">
                QR Acesso Studio
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Desenvolvimento, testes e homologação dos módulos do
                ecossistema QR Acesso.
              </p>
            </div>
          </div>
        </header>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black">Módulos principais</h2>

            <p className="mt-1 text-sm text-slate-400">
              Acesso rápido às áreas atuais do Studio.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {modulosPrincipais.map((modulo) => (
              <Link
                key={modulo.link}
                href={modulo.link}
                className={`rounded-3xl border p-5 transition-all active:scale-[0.98] ${modulo.classe}`}
              >
                <h3 className="text-xl font-black">{modulo.titulo}</h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {modulo.descricao}
                </p>

                <div className="mt-5 text-sm font-bold text-white">
                  Abrir módulo →
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black">🧪 Ferramentas de homologação</h2>

            <p className="mt-1 text-sm text-slate-400">
              Atalhos temporários para testes técnicos do Studio.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {ferramentasStudio.map((ferramenta) => (
              <Link
                key={ferramenta.link}
                href={ferramenta.link}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-center font-bold transition-all hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
              >
                {ferramenta.titulo}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
          <h2 className="text-xl font-black text-green-400">
            🚀 Próxima evolução
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Assistente de implantação para cadastrar o condomínio, gerar o
            slug, criar blocos e unidades, produzir um QR Code único e montar
            automaticamente os links dos moradores.
          </p>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-500">
          QR Acesso Studio • Desenvolvimento e homologação
        </footer>
      </div>
    </main>
  );
}