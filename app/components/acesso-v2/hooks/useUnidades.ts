"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../../services/firebase";
import type { Unidade } from "../types";

const apartamentos = [
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
  const blocoA = apartamentos.map((apartamento) => ({
    id: `1-${apartamento}`,
    nome: `Apto ${apartamento}`,
    tipo: "Apartamento",
    bloco: "Bloco A",
    condominioId: "cnd-tulipas",
  }));

  const blocoB = apartamentos.map((apartamento) => ({
    id: `2-${apartamento}`,
    nome: `Apto ${apartamento}`,
    tipo: "Apartamento",
    bloco: "Bloco B",
    condominioId: "cnd-tulipas",
  }));

  return [...blocoA, ...blocoB] as Unidade[];
}

function normalizarBloco(unidade: any): "Bloco A" | "Bloco B" | "Único" {
  const blocoOriginal = String(
    unidade.bloco ||
      unidade.blocoNome ||
      unidade.torre ||
      unidade.grupo ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    blocoOriginal === "a" ||
    blocoOriginal === "bloco a" ||
    blocoOriginal === "1" ||
    blocoOriginal === "bloco 1"
  ) {
    return "Bloco A";
  }

  if (
    blocoOriginal === "b" ||
    blocoOriginal === "bloco b" ||
    blocoOriginal === "2" ||
    blocoOriginal === "bloco 2"
  ) {
    return "Bloco B";
  }

  const id = String(unidade.id || "").trim().toLowerCase();
  const nome = String(unidade.nome || "").trim().toLowerCase();

  if (
    id.startsWith("1-") ||
    id.startsWith("1_") ||
    id.startsWith("1 ") ||
    nome.startsWith("1-") ||
    nome.startsWith("1_") ||
    nome.startsWith("1 ")
  ) {
    return "Bloco A";
  }

  if (
    id.startsWith("2-") ||
    id.startsWith("2_") ||
    id.startsWith("2 ") ||
    nome.startsWith("2-") ||
    nome.startsWith("2_") ||
    nome.startsWith("2 ")
  ) {
    return "Bloco B";
  }

  return "Único";
}

function normalizarNome(unidade: any): string {
  const nomeOriginal = String(unidade.nome || "").trim();

  if (/^apto\s+/i.test(nomeOriginal)) {
    return nomeOriginal;
  }

  const id = String(unidade.id || "").trim();
  const numeroPeloId = id.match(/^[12][-_ ](\d{2})$/)?.[1];

  if (numeroPeloId) {
    return `Apto ${numeroPeloId}`;
  }

  const numeroPeloNome = nomeOriginal.match(/^[12][-_ ]?(?:ap(?:to)?\s*)?(\d{2})$/i)?.[1];

  if (numeroPeloNome) {
    return `Apto ${numeroPeloNome}`;
  }

  return nomeOriginal || id || "Unidade";
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

        const unidadesDoFirebase = dados
          ? (Object.entries(dados).map(
              ([id, valor]: [string, any]) => {
                const unidadeCompleta = {
                  id,
                  ...valor,
                };

                return {
                  ...unidadeCompleta,
                  nome: normalizarNome(unidadeCompleta),
                  bloco: normalizarBloco(unidadeCompleta),
                };
              }
            ) as Unidade[])
          : [];

        /*
         * O Tulipas precisa sempre ter:
         * Bloco A: 1-11 até 1-44
         * Bloco B: 2-11 até 2-44
         *
         * Enquanto os cadastros do Firebase não estiverem completos,
         * usamos esta lista segura para não derrubar o Beta.
         */
        const unidadesTulipas = criarUnidadesTulipas();

        const mapa = new Map<string, Unidade>();

        unidadesTulipas.forEach((unidade) => {
          mapa.set(unidade.id, unidade);
        });

        unidadesDoFirebase.forEach((unidade) => {
          const existente = mapa.get(unidade.id);

          mapa.set(unidade.id, {
            ...(existente || {}),
            ...unidade,
            nome: normalizarNome(unidade),
            bloco: normalizarBloco(unidade),
          } as Unidade);
        });

        const lista = Array.from(mapa.values()).filter(
          (unidade) =>
            unidade.bloco === "Bloco A" || unidade.bloco === "Bloco B"
        );

        lista.sort((a, b) => {
          const ordemBlocoA = a.bloco === "Bloco A" ? 1 : 2;
          const ordemBlocoB = b.bloco === "Bloco A" ? 1 : 2;

          if (ordemBlocoA !== ordemBlocoB) {
            return ordemBlocoA - ordemBlocoB;
          }

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
