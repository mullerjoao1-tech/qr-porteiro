"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../../services/firebase";
import type { Unidade } from "../types";

const apartamentosTulipas = [
  "11",
  "12",
  "13",
  "14",
  "21",
  "22",
  "23",
  "24",
  "31",
  "32",
  "33",
  "34",
  "41",
  "42",
  "43",
  "44",
];

function criarUnidadesTulipas(): Unidade[] {
  const blocoA = apartamentosTulipas.map((apartamento) => ({
    id: `bloco-1-ap-${apartamento}`,
    nome: `Apto ${apartamento}`,
    tipo: "Apartamento",
    bloco: "Bloco A",
    condominioId: "cnd-tulipas",
  }));

  const blocoB = apartamentosTulipas.map((apartamento) => ({
    id: `bloco-2-ap-${apartamento}`,
    nome: `Apto ${apartamento}`,
    tipo: "Apartamento",
    bloco: "Bloco B",
    condominioId: "cnd-tulipas",
  }));

  return [...blocoA, ...blocoB] as Unidade[];
}

function descobrirApartamento(id: string, valor: any): string {
  const texto = `${id} ${valor?.nome || ""}`.toLowerCase();

  const peloId = texto.match(/bloco-[12]-ap-(\d{2})/)?.[1];

  if (peloId) return peloId;

  const peloNome = texto.match(/(?:ap(?:to)?\s*)?([1-4][1-4])\b/)?.[1];

  return peloNome || "";
}

function descobrirBloco(id: string, valor: any): "Bloco A" | "Bloco B" | "Único" {
  const texto = `${id} ${valor?.bloco || ""} ${valor?.nome || ""}`
    .toLowerCase()
    .trim();

  if (
    texto.includes("bloco-1") ||
    texto.includes("bloco 1") ||
    texto.includes("bloco a")
  ) {
    return "Bloco A";
  }

  if (
    texto.includes("bloco-2") ||
    texto.includes("bloco 2") ||
    texto.includes("bloco b")
  ) {
    return "Bloco B";
  }

  return "Único";
}

function normalizarUnidade(id: string, valor: any): Unidade {
  const apartamento = descobrirApartamento(id, valor);
  const bloco = descobrirBloco(id, valor);

  return {
    id,
    ...valor,
    nome: apartamento ? `Apto ${apartamento}` : valor?.nome || id,
    tipo: valor?.tipo || "Apartamento",
    bloco,
  } as Unidade;
}

export function useUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] =
    useState<Unidade | null>(null);

  useEffect(() => {
    setCarregando(true);

    const referencia = ref(db, "unidades-v2");

    const pararDeOuvir = onValue(
      referencia,
      (snapshot) => {
        const dados = snapshot.val();

        const unidadesReais = dados
          ? (Object.entries(dados).map(([id, valor]) =>
              normalizarUnidade(id, valor)
            ) as Unidade[])
          : [];

        const fallbackTulipas = criarUnidadesTulipas();

        const mapa = new Map<string, Unidade>();

        fallbackTulipas.forEach((unidade) => {
          mapa.set(unidade.id, unidade);
        });

        unidadesReais.forEach((unidade) => {
          mapa.set(unidade.id, {
            ...(mapa.get(unidade.id) || {}),
            ...unidade,
          });
        });

        const lista = Array.from(mapa.values()).filter(
          (unidade) =>
            unidade.bloco === "Bloco A" || unidade.bloco === "Bloco B"
        );

        lista.sort((a, b) => {
          const ordemA = a.bloco === "Bloco A" ? 1 : 2;
          const ordemB = b.bloco === "Bloco A" ? 1 : 2;

          if (ordemA !== ordemB) return ordemA - ordemB;

          return String(a.nome || a.id).localeCompare(
            String(b.nome || b.id),
            "pt-BR",
            { numeric: true }
          );
        });

        setUnidades(lista);
        setCarregando(false);

        setUnidadeSelecionada((unidadeAtual) => {
          if (!unidadeAtual) return null;

          return (
            lista.find((unidade) => unidade.id === unidadeAtual.id) || null
          );
        });
      },
      (erro) => {
        console.error("Erro ao carregar unidades-v2:", erro);
        setUnidades(criarUnidadesTulipas());
        setCarregando(false);
      }
    );

    return () => pararDeOuvir();
  }, []);

  const blocos = useMemo(() => ["Bloco A", "Bloco B"], []);

  const temBlocos = true;

  const unidadesDoBloco = useMemo(() => {
    if (!blocoSelecionado) return [];

    return unidades.filter(
      (unidade) => unidade.bloco === blocoSelecionado
    );
  }, [unidades, blocoSelecionado]);

  const unidadesFiltradas = useMemo(() => {
    const texto = busca.toLowerCase().trim();

    if (!texto) return unidadesDoBloco;

    return unidadesDoBloco.filter((unidade) =>
      `${unidade.nome || ""} ${unidade.tipo || ""} ${unidade.id}`
        .toLowerCase()
        .includes(texto)
    );
  }, [busca, unidadesDoBloco]);

  const unidadeAtualSelecionada = useMemo(() => {
    if (!unidadeSelecionada) return null;

    return (
      unidades.find((unidade) => unidade.id === unidadeSelecionada.id) ||
      unidadeSelecionada
    );
  }, [unidades, unidadeSelecionada]);

  function limparUnidadeSelecionada() {
    setUnidadeSelecionada(null);
  }

  function voltarBlocoBase() {
    setBlocoSelecionado("");
    setBusca("");
    setUnidadeSelecionada(null);
  }

  return {
    unidades,
    carregando,

    busca,
    setBusca,

    blocoSelecionado,
    setBlocoSelecionado,

    unidadeSelecionada,
    setUnidadeSelecionada,

    blocos,
    temBlocos,
    unidadesFiltradas,
    unidadeAtualSelecionada,

    limparUnidadeSelecionada,
    voltarBlocoBase,
  };
}