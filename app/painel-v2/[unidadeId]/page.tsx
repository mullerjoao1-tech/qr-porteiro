"use client";

import { useEffect, useMemo, useState } from "react";
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
  { id: "apto-102", nome: "Apto 102", tipo: "Apartamento" },
  { id: "apto-201", nome: "Apto 201", tipo: "Apartamento" },
  { id: "apto-202", nome: "Apto 202", tipo: "Apartamento" },
  { id: "casa-5", nome: "Casa 5", tipo: "Casa" },
];

export default function PainelV2Central() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");
const [unidadeAberta, setUnidadeAberta] = useState<Unidade | null>(null);
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
      const unidadeChamando = lista.find(
  (u) => u.chamada && u.chamada.status === "chamando"
);

if (unidadeChamando) {
  setUnidadeAberta(unidadeChamando);
}
      setUnidades(lista);
      setCarregando(false);
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
      const registro = {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        nome: chamada.nome || "Visitante",
        motivo: chamada.motivo || "Não informado",
        statusFinal: chamada.status || "Sem status",
        finalizadoEm: new Date().toISOString(),
        finalizadoEmFormatado: new Date().toLocaleString("pt-BR"),
        tipoFinalizacao: "Manual pelo painel central",
      };

      await set(ref(db, `historico-v2/${unidade.id}/${Date.now()}`), registro);
    }

    await remove(ref(db, `unidades-v2/${unidade.id}/chamada`));
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

  function textoStatus(unidade: Unidade) {
    if (unidade.chamada?.status === "Aguardando atendimento") {
      return "🚨 Chamando";
    }

    if (unidade.chamada?.status === "Em atendimento") {
      return "🟡 Em atendimento";
    }

    return "✅ Livre";
  }

  function tituloChamada(unidade: Unidade) {
    const motivo = unidade.chamada?.motivo;

    if (motivo === "Entrega de comida") return "🍔 ENTREGA DE COMIDA";
    if (motivo === "Entrega") return "📦 ENTREGA / ENCOMENDA";
    if (motivo === "Visitante") return "👤 VISITANTE";

    return "✍️ OUTRO CHAMADO";
  }

  function descricaoChamada(unidade: Unidade) {
    const chamada = unidade.chamada;

    if (!chamada) return "";

    if (chamada.motivo === "Visitante") {
      return chamada.nome || "Visitante";
    }

    if (chamada.motivo === "Entrega de comida") {
      return "Motoboy / entrega de comida";
    }

    if (chamada.motivo === "Entrega") {
      return "Entrega / encomenda";
    }

    return chamada.motivo || "Outro motivo";
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
            <button
              onClick={() => setFiltro("todos")}
              className={`py-3 rounded-xl font-bold ${
                filtro === "todos" ? "bg-blue-600" : "bg-slate-800"
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => setFiltro("chamando")}
              className={`py-3 rounded-xl font-bold ${
                filtro === "chamando" ? "bg-green-600" : "bg-slate-800"
              }`}
            >
              Chamando
            </button>

            <button
              onClick={() => setFiltro("atendimento")}
              className={`py-3 rounded-xl font-bold ${
                filtro === "atendimento" ? "bg-yellow-600" : "bg-slate-800"
              }`}
            >
              Atendimento
            </button>

            <button
              onClick={() => setFiltro("livres")}
              className={`py-3 rounded-xl font-bold ${
                filtro === "livres" ? "bg-slate-600" : "bg-slate-800"
              }`}
            >
              Livres
            </button>
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
      onClick={() => setUnidadeAberta(unidade)}
      className={`border-2 rounded-2xl p-4 text-left transition hover:scale-[1.02] ${corStatus(
        unidade
      )}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-black text-lg">🏠</span>
        <span className="text-xs font-bold">
          {unidade.chamada?.status === "Aguardando atendimento"
            ? "🟢"
            : unidade.chamada?.status === "Em atendimento"
            ? "🟡"
            : "⚪"}
        </span>
      </div>

      <h2 className="font-black text-sm md:text-base text-red-500">
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
          <h2 className="text-3xl font-black">
            🏠 {unidadeAberta.nome}
          </h2>
          <p className="text-slate-400">
            {unidadeAberta.tipo}
          </p>
        </div>

        <button
          onClick={() => setUnidadeAberta(null)}
          className="bg-red-600 px-4 py-2 rounded-xl font-bold"
        >
          Fechar
        </button>
      </div>

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
            onClick={() =>
              criarChamadaTeste(unidadeAberta, "Visitante")
            }
            className="w-full bg-slate-700 py-4 rounded-xl font-bold"
          >
            Criar teste: Visitante
          </button>

          <button
            onClick={() =>
              criarChamadaTeste(unidadeAberta, "Entrega")
            }
            className="w-full bg-blue-700 py-4 rounded-xl font-bold"
          >
            Criar teste: Entrega
          </button>

          <button
            onClick={() =>
              criarChamadaTeste(
                unidadeAberta,
                "Entrega de comida"
              )
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