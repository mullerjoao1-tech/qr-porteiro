"use client";

import { useState } from "react";

import PainelPessoas from "./PainelPessoas";
import PainelLocais from "./PainelLocais";
import PainelUnidades from "./PainelUnidades";
import PainelVinculos from "./PainelVinculos";
import PainelEstatisticas from "./PainelEstatisticas";

type Aba =
  | "pessoas"
  | "locais"
  | "unidades"
  | "vinculos"
  | "estatisticas";

const abas: Array<{
  id: Aba;
  nome: string;
  icone: string;
}> = [
  {
    id: "pessoas",
    nome: "Pessoas",
    icone: "👤",
  },
  {
    id: "locais",
    nome: "Locais",
    icone: "🏢",
  },
  {
    id: "unidades",
    nome: "Unidades",
    icone: "🚪",
  },
  {
    id: "vinculos",
    nome: "Vínculos",
    icone: "🔗",
  },
  {
    id: "estatisticas",
    nome: "Estatísticas",
    icone: "📊",
  },
];

export default function CadastroUniversal() {
  const [aba, setAba] =
    useState<Aba>("pessoas");

  const [
    filtroLocalId,
    setFiltroLocalId,
  ] = useState<string | null>(null);

  function abrirPessoasDoLocal(
    localId: string
  ) {
    setFiltroLocalId(localId);
    setAba("pessoas");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 p-5 text-white md:p-7">
        <p className="text-sm font-bold text-blue-100">
          🌐 QR CORE
        </p>

        <h2 className="mt-1 text-3xl font-black md:text-4xl">
          Cadastro Universal
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-blue-100 md:text-base">
          Pessoas, locais, unidades e vínculos conectados em uma única base.
        </p>
      </section>

      <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 md:flex md:overflow-x-auto">
        {abas.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              setAba(item.id)
            }
            className={`rounded-xl px-4 py-3 text-left text-sm font-black transition-all active:scale-95 md:shrink-0 ${
              aba === item.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <span className="mr-2">
              {item.icone}
            </span>

            {item.nome}
          </button>
        ))}
      </nav>

      {aba === "pessoas" && (
        <PainelPessoas
          filtroLocalId={
            filtroLocalId
          }
          onLimparFiltroLocal={() =>
            setFiltroLocalId(null)
          }
        />
      )}

      {aba === "locais" && (
        <PainelLocais
          onVerPessoas={
            abrirPessoasDoLocal
          }
        />
      )}

      {aba === "unidades" && (
        <PainelUnidades />
      )}

      {aba === "vinculos" && (
        <PainelVinculos />
      )}

      {aba === "estatisticas" && (
        <PainelEstatisticas />
      )}
    </div>
  );
}
