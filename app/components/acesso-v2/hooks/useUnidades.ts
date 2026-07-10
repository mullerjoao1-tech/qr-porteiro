"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../../services/firebase";
import type { Unidade } from "../types";

export function useUnidades(condominioId?: string) {
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

        const listaCompleta = Object.entries(dados).map(
          ([id, valor]: [string, any]) => ({
            id,
            ...valor,
          })
        ) as Unidade[];

        /*
         * Quando as unidades já possuem condominioId/condominio,
         * mostra apenas as unidades do condomínio aberto.
         *
         * O fallback para a lista completa mantém compatibilidade
         * com cadastros antigos que ainda não possuem esse campo.
         */
        const existemUnidadesComCondominio = listaCompleta.some(
          (unidade: any) =>
            Boolean(unidade.condominioId) || Boolean(unidade.condominio)
        );

        const lista =
          condominioId && existemUnidadesComCondominio
            ? listaCompleta.filter((unidade: any) => {
                const idDoCondominio =
                  unidade.condominioId || unidade.condominio || "";

                return String(idDoCondominio) === String(condominioId);
              })
            : listaCompleta;

        lista.sort((a, b) =>
          String(a.nome || a.id).localeCompare(String(b.nome || b.id), "pt-BR", {
            numeric: true,
          })
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
        /*
         * Antes, qualquer erro do Firebase deixava a tela presa para sempre
         * em "Carregando unidades...".
         */
        console.error("Erro ao carregar unidades-v2:", erro);
        setUnidades([]);
        setCarregando(false);
      }
    );

    return () => pararDeOuvir();
  }, [condominioId]);

  const blocos = useMemo(() => {
    const lista = unidades
      .map((unidade) => unidade.bloco || "Único")
      .filter((valor, index, array) => array.indexOf(valor) === index);

    return lista.sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR", { numeric: true })
    );
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
