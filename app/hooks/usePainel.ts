"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, remove, set, update } from "firebase/database";

import { db } from "../services/firebase";
import type { UnidadePainel } from "../components/painel/CardUnidade";

const unidadesIniciais: UnidadePainel[] = [
  { id: "apto-101", nome: "Apto 101", tipo: "Apartamento" },
  { id: "apto-102", nome: "Apto 102", tipo: "Apartamento" },
  { id: "apto-201", nome: "Apto 201", tipo: "Apartamento" },
  { id: "apto-202", nome: "Apto 202", tipo: "Apartamento" },
  { id: "casa-5", nome: "Casa 5", tipo: "Casa" },
];

export function usePainel() {
  // ======================================================
  // ESTADOS
  // ======================================================

  const [unidades, setUnidades] = useState<UnidadePainel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  const [unidadeAberta, setUnidadeAberta] =
    useState<UnidadePainel | null>(null);

  // ======================================================
  // FIREBASE
  // ======================================================

  useEffect(() => {
    const referencia = ref(db, "unidades-v2");

    const pararDeOuvir = onValue(
      referencia,
      (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
          const objetoInicial: Record<string, UnidadePainel> = {};

          unidadesIniciais.forEach((unidade) => {
            objetoInicial[unidade.id] = unidade;
          });

          void set(ref(db, "unidades-v2"), objetoInicial);

          setUnidades(unidadesIniciais);
          setCarregando(false);
          return;
        }

        const lista = Object.entries(dados).map(([id, valor]) => ({
          id,
          ...(valor as Omit<UnidadePainel, "id">),
        })) as UnidadePainel[];

        lista.sort((a, b) => a.nome.localeCompare(b.nome));

        setUnidades(lista);

        setUnidadeAberta((unidadeAtual) => {
          if (unidadeAtual) {
            return (
              lista.find((unidade) => unidade.id === unidadeAtual.id) || null
            );
          }

          const unidadeChamando = lista.find(
            (unidade) =>
              unidade.chamada?.status === "Aguardando atendimento" ||
              unidade.chamada?.status === "chamando"
          );

          return unidadeChamando || null;
        });

        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao carregar unidades:", erro);
        setCarregando(false);
      }
    );

    return () => pararDeOuvir();
  }, []);

  // ======================================================
  // CÁLCULOS
  // ======================================================

  const unidadesFiltradas = useMemo(() => {
    if (filtro === "todos") {
      return unidades;
    }

    if (filtro === "chamando") {
      return unidades.filter(
        (unidade) =>
          unidade.chamada?.status === "Aguardando atendimento"
      );
    }

    if (filtro === "atendimento") {
      return unidades.filter(
        (unidade) => unidade.chamada?.status === "Em atendimento"
      );
    }

    if (filtro === "livres") {
      return unidades.filter((unidade) => !unidade.chamada);
    }

    return unidades;
  }, [unidades, filtro]);

  const totalChamando = unidades.filter(
    (unidade) =>
      unidade.chamada?.status === "Aguardando atendimento"
  ).length;

  const totalAtendimento = unidades.filter(
    (unidade) => unidade.chamada?.status === "Em atendimento"
  ).length;

  const totalLivres = unidades.filter(
    (unidade) => !unidade.chamada
  ).length;

  // ======================================================
  // AÇÕES
  // ======================================================

  async function criarChamadaTeste(
    unidade: UnidadePainel,
    motivo: string
  ) {
    await update(ref(db, `unidades-v2/${unidade.id}`), {
      chamada: {
        nome: motivo === "Visitante" ? "Visitante teste" : motivo,
        motivo,
        status: "Aguardando atendimento",
        criadoEm: new Date().toISOString(),
      },
    });
  }

  async function atenderChamada(unidade: UnidadePainel) {
    await update(
      ref(db, `unidades-v2/${unidade.id}/chamada`),
      {
        status: "Em atendimento",
        atendidoEm: new Date().toISOString(),
      }
    );
  }

  async function enviarMensagem(
    unidade: UnidadePainel,
    mensagem: string
  ) {
    await update(
      ref(db, `unidades-v2/${unidade.id}/chamada`),
      {
        status: "Em atendimento",
        mensagemResponsavel: mensagem,
        atendidoEm: new Date().toISOString(),
      }
    );
  }

  async function finalizarChamada(unidade: UnidadePainel) {
    const chamada = unidade.chamada;

    if (chamada) {
      const agora = new Date();

      const registro = {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        nome: chamada.nome || "Visitante",
        motivo: chamada.motivo || "Não informado",
        statusFinal: chamada.status || "Sem status",
        finalizadoEm: agora.toISOString(),
        finalizadoEmFormatado: agora.toLocaleString("pt-BR"),
        tipoFinalizacao: "Manual pelo painel central",
      };

      await set(
        ref(db, `historico-v2/${unidade.id}/${Date.now()}`),
        registro
      );
    }

    await remove(
      ref(db, `unidades-v2/${unidade.id}/chamada`)
    );

    setUnidadeAberta(null);
  }

  // ======================================================
  // RETORNO
  // ======================================================

  return {
    unidades,
    unidadesFiltradas,
    carregando,

    filtro,
    setFiltro,

    unidadeAberta,
    setUnidadeAberta,

    totalChamando,
    totalAtendimento,
    totalLivres,

    criarChamadaTeste,
    atenderChamada,
    enviarMensagem,
    finalizarChamada,
  };
}