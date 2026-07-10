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

function criarFallbackTulipas(): Unidade[] {
  const blocoA = apartamentosTulipas.map((apartamento) => ({
    id: `1-${apartamento}`,
    nome: `Apto ${apartamento}`,
    tipo: "Apartamento",
    bloco: "Bloco A",
    condominioId: "cnd-tulipas",
  }));

  const blocoB = apartamentosTulipas.map((apartamento) => ({
    id: `2-${apartamento}`,
    nome: `Apto ${apartamento}`,
    tipo: "Apartamento",
    bloco: "Bloco B",
    condominioId: "cnd-tulipas",
  }));

  return [...blocoA, ...blocoB] as Unidade[];
}

function descobrirNumeroApartamento(unidade: any): string {
  const texto = `${unidade.nome || ""} ${unidade.id || ""}`.toLowerCase();

  const correspondencia =
    texto.match(/(?:ap(?:to)?\s*)?([1-4][1-4])\b/i) ||
    texto.match(/[-_\s]([1-4][1-4])(?:\b|$)/i);

  return correspondencia?.[1] || "";
}

function descobrirBloco(unidade: any): "Bloco A" | "Bloco B" | "Único" {
  const blocoInformado = String(
    unidade.bloco ||
      unidade.blocoNome ||
      unidade.torre ||
      unidade.grupo ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    blocoInformado === "a" ||
    blocoInformado === "bloco a" ||
    blocoInformado === "1" ||
    blocoInformado === "bloco 1"
  ) {
    return "Bloco A";
  }

  if (
    blocoInformado === "b" ||
    blocoInformado === "bloco b" ||
    blocoInformado === "2" ||
    blocoInformado === "bloco 2"
  ) {
    return "Bloco B";
  }

  const texto = `${unidade.nome || ""} ${unidade.id || ""}`
    .trim()
    .toLowerCase();

  if (
    texto.startsWith("1 ") ||
    texto.startsWith("1-") ||
    texto.startsWith("1_") ||
    /\bbloco\s*1\b/.test(texto) ||
    /\bbloco\s*a\b/.test(texto)
  ) {
    return "Bloco A";
  }

  if (
    texto.startsWith("2 ") ||
    texto.startsWith("2-") ||
    texto.startsWith("2_") ||
    /\bbloco\s*2\b/.test(texto) ||
    /\bbloco\s*b\b/.test(texto)
  ) {
    return "Bloco B";
  }

  return "Único";
}

function normalizarUnidade(id: string, valor: any): Unidade {
  const unidadeOriginal = {
    id,
    ...valor,
  };

  const apartamento = descobrirNumeroApartamento(unidadeOriginal);
  const bloco = descobrirBloco(unidadeOriginal);

  return {
    ...unidadeOriginal,

    /*
     * IMPORTANTE:
     * O ID verdadeiro do Firebase é preservado.
     * É esse ID que o sistema usa para gravar a chamada.
     */
    id,

    nome: apartamento
      ? `Apto ${apartamento}`
      : String(unidadeOriginal.nome || id),

    tipo: unidadeOriginal.tipo || "Apartamento",
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

        /*
         * Quando há dados no Firebase, usamos SOMENTE as unidades reais.
         * Assim a chamada é gravada no mesmo ID que já existe no sistema.
         */
        const listaReal = dados
          ? (Object.entries(dados).map(([id, valor]) =>
              normalizarUnidade(id, valor)
            ) as Unidade[])
          : [];

        const unidadesComBloco = listaReal.filter(
          (unidade) =>
            unidade.bloco === "Bloco A" || unidade.bloco === "Bloco B"
        );

        /*
         * A lista fixa é apenas contingência.
         * Ela só entra quando o Firebase realmente não devolve nenhuma unidade.
         */
        const lista =
          unidadesComBloco.length > 0
            ? unidadesComBloco
            : listaReal.length > 0
            ? listaReal
            : criarFallbackTulipas();

        lista.sort((a, b) => {
          const ordemA = a.bloco === "Bloco A" ? 1 : a.bloco === "Bloco B" ? 2 : 3;
          const ordemB = b.bloco === "Bloco A" ? 1 : b.bloco === "Bloco B" ? 2 : 3;

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

        setUnidades(criarFallbackTulipas());
        setCarregando(false);
      }
    );

    return () => pararDeOuvir();
  }, []);

  const blocos = useMemo(() => {
    const encontrados = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, indice, lista) => lista.indexOf(valor) === indice);

    const ordem: Record<string, number> = {
      "Bloco A": 1,
      "Bloco B": 2,
      Único: 99,
    };

    return encontrados.sort((a, b) => {
      const ordemA = ordem[a] ?? 50;
      const ordemB = ordem[b] ?? 50;

      if (ordemA !== ordemB) return ordemA - ordemB;

      return String(a).localeCompare(String(b), "pt-BR");
    });
  }, [unidades]);

  const temBlocos =
    blocos.length > 1 || (blocos.length === 1 && blocos[0] !== "Único");

  const unidadesDoBloco = useMemo(() => {
    if (!temBlocos) return unidades;
    if (!blocoSelecionado) return [];

    return unidades.filter(
      (unidade) => (unidade.bloco || "Único") === blocoSelecionado
    );
  }, [unidades, blocoSelecionado, temBlocos]);

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
