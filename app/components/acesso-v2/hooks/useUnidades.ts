"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../../services/firebase";
import type { Unidade } from "../types";

export function useUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] =
    useState<Unidade | null>(null);

  useEffect(() => {
    const referencia = ref(db, "unidades-v2");

    const pararDeOuvir = onValue(referencia, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidades([]);
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

      setUnidadeSelecionada((unidadeAtual) => {
        if (!unidadeAtual) return null;

        const unidadeAtualizada = lista.find(
          (unidade) => unidade.id === unidadeAtual.id
        );

        return unidadeAtualizada || unidadeAtual;
      });
    });

    return () => pararDeOuvir();
  }, []);

  const blocos = useMemo(() => {
    const lista = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, index, array) => array.indexOf(valor) === index);

    return lista.sort();
  }, [unidades]);

  const temBlocos = blocos.length > 1 || blocos[0] !== "Único";

  const unidadesDoBloco = useMemo(() => {
    if (!temBlocos) return unidades;

    return unidades.filter(
      (unidade) => (unidade.bloco || "Único") === blocoSelecionado
    );
  }, [unidades, blocoSelecionado, temBlocos]);

  const unidadesFiltradas = useMemo(() => {
    const texto = busca.toLowerCase().trim();

    if (!texto) return unidadesDoBloco;

    return unidadesDoBloco.filter((unidade) =>
      `${unidade.nome} ${unidade.tipo || ""} ${unidade.id}`
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