"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../../services/firebase";

type Local = {
  id: string;
  nome: string;
  slug: string;
  tipo: string;
};

type Unidade = {
  id: string;
  localId: string;
  bloco: string;
  nome: string;
};

export default function AcessoLocal() {
  const params = useParams();
  const slug = params?.slug as string;

  const [local, setLocal] = useState<Local | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [blocos, setBlocos] = useState<string[]>([]);

  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");

  const [nomeVisitante, setNomeVisitante] = useState("");
  const [motivo, setMotivo] = useState("");
const [motivoOutro, setMotivoOutro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const locaisRef = ref(db, "qrCentral/locais");

    const desligar = onValue(locaisRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setCarregando(false);
        return;
      }

      const lista = Object.entries(dados).map(([id, valor]: any) => ({
        id,
        ...valor,
      }));

      const encontrado = lista.find((item: any) => item.slug === slug);

      if (encontrado) {
        setLocal(encontrado);
      }

      setCarregando(false);
    });

    return () => desligar();
  }, [slug]);

  useEffect(() => {
    if (!local) return;

    const unidadesRef = ref(db, "qrCentral/unidades");

    const desligar = onValue(unidadesRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidades([]);
        return;
      }

      const lista = Object.entries(dados)
        .map(([id, valor]: any) => ({
          id,
          ...valor,
        }))
        .filter((item: any) => item.localId === local.id);

      setUnidades(lista as Unidade[]);

      const blocosUnicos = Array.from(
        new Set(
          lista
            .map((u: any) => u.bloco)
            .filter((b: string) => b && b.trim() !== "")
        )
      );

      setBlocos(blocosUnicos);
    });

    return () => desligar();
  }, [local]);

  async function chamar() {
    if (!unidadeSelecionada) {
      alert("Selecione uma unidade.");
      return;
    }

    if (!nomeVisitante.trim()) {
      alert("Digite seu nome.");
      return;
    }

    setEnviando(true);

    try {
      const chamadasRef = ref(db, "qrChamadas");
      const novaChamadaRef = push(chamadasRef);

      await set(novaChamadaRef, {
        localId: local?.id,
        unidadeId: unidadeSelecionada,
        visitanteNome: nomeVisitante,
        motivo: motivo === "❓ Outros" ? motivoOutro : motivo,
        status: "aguardando",
        criadoEm: new Date().toISOString(),
      });

      alert("Chamada enviada com sucesso.");

      setNomeVisitante("");
      setMotivo("");
      setMotivoOutro("");
      setUnidadeSelecionada("");
      setBlocoSelecionado("");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao enviar chamada.");
    } finally {
      setEnviando(false);
    }
  }

  const unidadesFiltradas = blocoSelecionado
    ? unidades.filter((u) => u.bloco === blocoSelecionado)
    : unidades;

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando...
      </main>
    );
  }

  if (!local) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Local não encontrado.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <h1 className="text-3xl font-black text-blue-400 mb-2">
          QR Acesso
        </h1>

        <p className="text-xl mb-6">{local.nome}</p>

        <div className="space-y-4">
          {blocos.length > 0 && (
            <select
              value={blocoSelecionado}
              onChange={(e) => setBlocoSelecionado(e.target.value)}
              className="w-full bg-slate-800 rounded-xl p-3"
            >
              <option value="">Selecione bloco</option>

              {blocos.map((bloco) => (
                <option key={bloco}>{bloco}</option>
              ))}
            </select>
          )}

          <select
            value={unidadeSelecionada}
            onChange={(e) => setUnidadeSelecionada(e.target.value)}
            className="w-full bg-slate-800 rounded-xl p-3"
          >
            <option value="">Selecione unidade</option>

            {unidadesFiltradas.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.bloco
                  ? `${unidade.bloco} / ${unidade.nome}`
                  : unidade.nome}
              </option>
            ))}
          </select>

         <div>
  <p className="text-sm text-slate-400 mb-2">Motivo da chamada</p>

  <div className="grid grid-cols-2 gap-2">
    {[
  "📦 Entrega",
  "🍔 Comida",
  "👤 Visita",
  "🛠️ Serviço",
  "🚗 Motorista/App",
  "❓ Outros",
].map(
      (item) => (
        <button
          key={item}
          type="button"
          onClick={() => setMotivo(item)}
          className={`rounded-xl p-3 font-bold text-sm ${
            motivo === item
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {item}
        </button>
      )
    )}
  </div>
</div>

{motivo === "❓ Outros" && (
  <input
   value={motivoOutro}
onChange={(e) => setMotivoOutro(e.target.value)}
    placeholder="Digite o motivo"
    className="w-full bg-slate-800 rounded-xl p-3"
  />
)}

          <input
  value={nomeVisitante}
  onChange={(e) => setNomeVisitante(e.target.value)}
  placeholder="Seu nome"
  className="w-full bg-slate-800 rounded-xl p-3"
/>

          <button
            onClick={chamar}
            disabled={enviando}
            className="w-full bg-blue-600 py-3 rounded-xl font-black"
          >
            {enviando ? "Enviando..." : "CHAMAR"}
          </button>
        </div>
      </div>
    </main>
  );
}