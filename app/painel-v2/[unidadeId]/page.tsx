"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ref, onValue, set, update, remove } from "firebase/database";
import { db } from "../../services/firebase";

type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  chamada?: {
    nome?: string;
    motivo?: string;
    status?: string;
    criadoEm?: string;
    mensagemResponsavel?: string;
  };
};

const unidadesIniciais: Unidade[] = [
  { id: "apto-101", nome: "Apto 101", tipo: "Apartamento" },
];

export default function PainelV2Central() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [unidadeAberta, setUnidadeAberta] = useState<Unidade | null>(null);

  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const referencia = ref(db, "unidades-v2");

    const pararDeOuvir = onValue(referencia, async (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        const objetoInicial: Record<string, Unidade> = {};

        unidadesIniciais.forEach((unidade) => {
          objetoInicial[unidade.id] = unidade;
        });

        await set(ref(db, "unidades-v2"), objetoInicial);
        setUnidades(unidadesIniciais);
        setCarregando(false);
        return;
      }

      const lista = Object.entries(dados).map(([id, valor]: any) => ({
        id,
        ...valor,
      })) as Unidade[];

      lista.sort((a, b) => a.nome.localeCompare(b.nome));

      setUnidades(lista);
      setCarregando(false);

      const unidadeChamando = lista.find(
        (u) => u.chamada?.status === "Aguardando atendimento"
      );

      if (unidadeChamando) {
        setTimeout(() => {
          cardRefs.current[unidadeChamando.id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 200);
      }

      setUnidadeAberta((unidadeAtual) => {
        if (unidadeAtual) {
          const unidadeAtualizada = lista.find((u) => u.id === unidadeAtual.id);
          return unidadeAtualizada || null;
        }

        return unidadeChamando || null;
      });
    });

    return () => pararDeOuvir();
  }, []);

  const unidadesFiltradas = useMemo(() => {
    if (filtro === "todos") return unidades;

    if (filtro === "chamando") {
      return unidades.filter(
        (u) => u.chamada?.status === "Aguardando atendimento"
      );
    }

    if (filtro === "atendimento") {
      return unidades.filter((u) => u.chamada?.status === "Em atendimento");
    }

    if (filtro === "livres") {
      return unidades.filter((u) => !u.chamada);
    }

    return unidades;
  }, [unidades, filtro]);

  const totalChamando = unidades.filter(
    (u) => u.chamada?.status === "Aguardando atendimento"
  ).length;

  const totalAtendimento = unidades.filter(
    (u) => u.chamada?.status === "Em atendimento"
  ).length;

  const totalLivres = unidades.filter((u) => !u.chamada).length;

  async function criarChamadaTeste(unidade: Unidade, motivo: string) {
    await update(ref(db, `unidades-v2/${unidade.id}`), {
      chamada: {
        nome: motivo === "Visitante" ? "Visitante teste" : motivo,
        motivo,
        status: "Aguardando atendimento",
        criadoEm: new Date().toISOString(),
      },
    });
  }

  async function atenderChamada(unidade: Unidade) {
    await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
      status: "Em atendimento",
      atendidoEm: new Date().toISOString(),
    });
  }

  async function enviarMensagem(unidade: Unidade, mensagem: string) {
    await update(ref(db, `unidades-v2/${unidade.id}/chamada`), {
      status: "Em atendimento",
      mensagemResponsavel: mensagem,
      atendidoEm: new Date().toISOString(),
    });
  }

  async function finalizarChamada(unidade: Unidade) {
    const chamada = unidade.chamada;

    if (chamada) {
      await set(ref(db, `historico-v2/${unidade.id}/${Date.now()}`), {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        nome: chamada.nome || "Visitante",
        motivo: chamada.motivo || "Não informado",
        statusFinal: chamada.status || "Sem status",
        finalizadoEm: new Date().toISOString(),
        finalizadoEmFormatado: new Date().toLocaleString("pt-BR"),
        tipoFinalizacao: "Manual pelo painel central",
      });
    }

    await remove(ref(db, `unidades-v2/${unidade.id}/chamada`));
    setUnidadeAberta(null);
  }

  function corStatus(unidade: Unidade) {
    if (unidade.chamada?.status === "Aguardando atendimento") {
      return "border-green-400 bg-green-500/10";
    }

    if (unidade.chamada?.status === "Em atendimento") {
      return "border-yellow-400 bg-yellow-500/10";
    }

    return "border-slate-700 bg-slate-900";
  }

  function bolinhaStatus(unidade: Unidade) {
    if (unidade.chamada?.status === "Aguardando atendimento") return "🟢";
    if (unidade.chamada?.status === "Em atendimento") return "🟡";
    return "⚪";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      <div className="w-full max-w-7xl mx-auto">
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-6 mb-6">
          <p className="text-green-400 font-bold text-sm mb-1">
            QR ACESSO • CENTRAL V2
          </p>

          <h1 className="text-3xl md:text-5xl font-black">
            🏢 Painel Central do Condomínio
          </h1>

          <p className="text-slate-400 mt-2">
            Visualize todas as unidades, chamadas, entregas e atendimentos em um
            só lugar.
          </p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black">{unidades.length}</p>
            <p className="text-xs text-slate-400">Unidades</p>
          </div>

          <div className="bg-slate-900 border border-green-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-green-400">
              {totalChamando}
            </p>
            <p className="text-xs text-slate-400">Chamando</p>
          </div>

          <div className="bg-slate-900 border border-yellow-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-yellow-400">
              {totalAtendimento}
            </p>
            <p className="text-xs text-slate-400">Em atendimento</p>
          </div>

          <div className="bg-slate-900 border border-blue-700 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-400">{totalLivres}</p>
            <p className="text-xs text-slate-400">Livres</p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["todos", "chamando", "atendimento", "livres"].map((item) => (
              <button
                key={item}
                onClick={() => setFiltro(item)}
                className={`py-3 rounded-xl font-bold ${
                  filtro === item ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                {item === "todos"
                  ? "Todos"
                  : item === "chamando"
                  ? "Chamando"
                  : item === "atendimento"
                  ? "Atendimento"
                  : "Livres"}
              </button>
            ))}
          </div>
        </section>

        {carregando ? (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 text-center text-slate-400">
            Carregando unidades...
          </div>
        ) : (
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {unidadesFiltradas.map((unidade) => (
              <button
                key={unidade.id}
                ref={(el) => {
                  cardRefs.current[unidade.id] = el;
                }}
                onClick={() => setUnidadeAberta(unidade)}
                className={`border-2 rounded-2xl p-3 text-left shadow-xl hover:scale-[1.02] transition relative ${
                  unidade.chamada?.status === "Aguardando atendimento"
                    ? "animate-pulse ring-4 ring-green-400 shadow-green-500/50"
                    : ""
                } ${corStatus(unidade)}`}
              >
                {unidade.chamada?.status === "Aguardando atendimento" && (
                  <div className="mb-2 bg-green-500 text-black text-[10px] font-black px-2 py-1 rounded-lg text-center animate-pulse">
                    🔔 CHAMADO AQUI
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span>🏠</span>
                  <span>{bolinhaStatus(unidade)}</span>
                </div>

                <h2 className="font-black text-sm md:text-base">
                  {unidade.nome}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  {unidade.tipo || "Unidade"}
                </p>
              </button>
            ))}
          </section>
        )}
      </div>

      {unidadeAberta && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black">🏠 {unidadeAberta.nome}</h2>
                <p className="text-slate-400">
                  {unidadeAberta.tipo || "Unidade"}
                </p>
              </div>

              <button
                onClick={() => setUnidadeAberta(null)}
                className="bg-red-600 px-4 py-2 rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>

            {unidadeAberta.chamada && (
              <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 mb-4">
                <p className="text-green-400 font-black text-xl">
                  {unidadeAberta.chamada.nome || "Visitante"}
                </p>

                <p className="text-slate-300 mt-1">
                  Motivo: {unidadeAberta.chamada.motivo || "Não informado"}
                </p>

                <p className="text-yellow-400 mt-1">
                  Status: {unidadeAberta.chamada.status || "Sem status"}
                </p>
              </div>
            )}

            {unidadeAberta.chamada ? (
              <div className="space-y-3">
                <button
                  onClick={() => atenderChamada(unidadeAberta)}
                  className="w-full bg-green-500 py-4 rounded-xl font-black text-black"
                >
                  ✅ Atender
                </button>

                <button
                  onClick={() =>
                    enviarMensagem(
                      unidadeAberta,
                      "Aguarde um momento, por favor."
                    )
                  }
                  className="w-full bg-blue-600 py-4 rounded-xl font-bold"
                >
                  💬 Aguarde um momento
                </button>

                <button
                  onClick={() => finalizarChamada(unidadeAberta)}
                  className="w-full bg-red-600 py-4 rounded-xl font-black"
                >
                  ❌ Finalizar
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                <button
                  onClick={() => criarChamadaTeste(unidadeAberta, "Visitante")}
                  className="w-full bg-slate-700 py-4 rounded-xl font-bold"
                >
                  Criar teste: Visitante
                </button>

                <button
                  onClick={() => criarChamadaTeste(unidadeAberta, "Entrega")}
                  className="w-full bg-blue-700 py-4 rounded-xl font-bold"
                >
                  Criar teste: Entrega
                </button>

                <button
                  onClick={() =>
                    criarChamadaTeste(unidadeAberta, "Entrega de comida")
                  }
                  className="w-full bg-orange-600 py-4 rounded-xl font-bold"
                >
                  Criar teste: 🍔 Comida
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}