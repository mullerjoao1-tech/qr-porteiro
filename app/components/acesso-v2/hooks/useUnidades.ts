"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../../services/firebase";
import type { Unidade } from "../types";

function identificarBloco(unidade: any): string {
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

  const textoUnidade = `${unidade.nome || ""} ${unidade.id || ""}`
    .trim()
    .toLowerCase();

  /*
   * As unidades atuais do Tulipas estão identificadas no nome/ID
   * com o número do bloco, por exemplo:
   * "1 ap 11" = Bloco A
   * "2 ap 11" = Bloco B
   */
  if (
    /(^|[\s_-])1([\s_-]|$)/.test(textoUnidade) ||
    textoUnidade.startsWith("1 ap") ||
    textoUnidade.startsWith("1-ap") ||
    textoUnidade.startsWith("1_ap")
  ) {
    return "Bloco A";
  }

  if (
    /(^|[\s_-])2([\s_-]|$)/.test(textoUnidade) ||
    textoUnidade.startsWith("2 ap") ||
    textoUnidade.startsWith("2-ap") ||
    textoUnidade.startsWith("2_ap")
  ) {
    return "Bloco B";
  }

  return blocoInformado
    ? blocoInformado.replace(/\b\w/g, (letra) => letra.toUpperCase())
    : "Único";
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

        if (!dados) {
          setUnidades([]);
          setCarregando(false);
          return;
        }

        const lista = Object.entries(dados).map(
          ([id, valor]: [string, any]) => {
            const unidadeCompleta = {
              id,
              ...valor,
            };

            return {
              ...unidadeCompleta,
              bloco: identificarBloco(unidadeCompleta),
            };
          }
        ) as Unidade[];

        lista.sort((a, b) =>
          String(a.nome || a.id).localeCompare(
            String(b.nome || b.id),
            "pt-BR",
            {
              numeric: true,
            }
          )
        );

        setUnidades(lista);
        setCarregando(false);

        setUnidadeSelecionada((unidadeAtual) => {
          if (!unidadeAtual) return null;

          const unidadeAtualizada = lista.find(
            (unidade) => unidade.id === unidadeAtual.id
          );

          return unidadeAtualizada || null;
        });
      },
      (erro) => {
        console.error("Erro ao carregar unidades-v2:", erro);
        setUnidades([]);
        setCarregando(false);
      }
    );

    return () => pararDeOuvir();
  }, []);

  const blocos = useMemo(() => {
    const lista = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, index, array) => array.indexOf(valor) === index);

    const ordemBlocos: Record<string, number> = {
      "Bloco A": 1,
      "Bloco B": 2,
      Único: 99,
    };

    return lista.sort((a, b) => {
      const ordemA = ordemBlocos[a] ?? 50;
      const ordemB = ordemBlocos[b] ?? 50;

      if (ordemA !== ordemB) return ordemA - ordemB;

      return String(a).localeCompare(String(b), "pt-BR", {
        numeric: true,
      });
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
