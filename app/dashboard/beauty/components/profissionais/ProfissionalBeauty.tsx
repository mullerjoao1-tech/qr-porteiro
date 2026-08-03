"use client";

import { useEffect, useMemo, useState } from "react";
import ProfissionalCard from "./ProfissionalCard";
import ProfissionalDetalhesModal from "./ProfissionalDetalhesModal";
import ProfissionalFiltros from "./ProfissionalFiltros";
import {
  alterarStatusProfissional,
  criarProfissional,
  observarProfissionais,
} from "./ProfissionalFirebase";
import ProfissionalIndicadores from "./ProfissionalIndicadores";
import ProfissionalNovoModal from "./ProfissionalNovoModal";
import type {
  FiltroStatusProfissional,
  NovoProfissionalBeauty,
  ProfissionalBeauty as ProfissionalBeautyType,
} from "./ProfissionalTypes";

export default function ProfissionalBeauty() {
  const [profissionais, setProfissionais] = useState<
    ProfissionalBeautyType[]
  >([]);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusProfissional>("todos");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [novoModalAberto, setNovoModalAberto] =
    useState(false);

  const [profissionalSelecionado, setProfissionalSelecionado] =
    useState<ProfissionalBeautyType | null>(null);

  useEffect(() => {
    const cancelarObservacao = observarProfissionais(
      (dados) => {
        setProfissionais(dados);
        setCarregando(false);
        setErro("");
      },
      (erroRecebido) => {
        setErro(erroRecebido.message);
        setCarregando(false);
      }
    );

    return cancelarObservacao;
  }, []);

  const profissionaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return profissionais.filter((profissional) => {
      const correspondeStatus =
        filtroStatus === "todos" ||
        profissional.status === filtroStatus;

      const correspondeBusca =
        !termo ||
        profissional.nome.toLowerCase().includes(termo) ||
        profissional.telefone.toLowerCase().includes(termo) ||
        profissional.especialidades.some((especialidade) =>
          especialidade.toLowerCase().includes(termo)
        );

      return correspondeStatus && correspondeBusca;
    });
  }, [busca, filtroStatus, profissionais]);

  const totalAtivos = profissionais.filter(
    (profissional) => profissional.status === "ativo"
  ).length;

  const totalInativos = profissionais.filter(
    (profissional) => profissional.status === "inativo"
  ).length;

  const totalEspecialidades = new Set(
    profissionais.flatMap(
      (profissional) => profissional.especialidades
    )
  ).size;

  async function salvarProfissional(
    novoProfissional: NovoProfissionalBeauty
  ) {
    await criarProfissional(novoProfissional);
  }

  async function mudarStatusProfissional(
    profissionalId: string,
    status: "ativo" | "inativo"
  ) {
    await alterarStatusProfissional(
      profissionalId,
      status
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-300">
          QR Beauty
        </p>

        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
          Profissionais
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Equipe, especialidades, jornadas e disponibilidade.
        </p>
      </div>

      <ProfissionalIndicadores
        total={profissionais.length}
        ativos={totalAtivos}
        inativos={totalInativos}
        especialidades={totalEspecialidades}
      />

      <ProfissionalFiltros
        busca={busca}
        filtroStatus={filtroStatus}
        onBuscaChange={setBusca}
        onFiltroChange={setFiltroStatus}
        onNovoProfissional={() =>
          setNovoModalAberto(true)
        }
      />

      {carregando && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center font-bold text-slate-400">
          Carregando profissionais...
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 font-bold text-red-300">
          {erro}
        </div>
      )}

      {!carregando &&
        profissionaisFiltrados.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
            <p className="text-lg font-black text-white">
              Nenhum profissional encontrado
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Cadastre o primeiro profissional ou ajuste os filtros.
            </p>
          </div>
        )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profissionaisFiltrados.map((profissional) => (
          <ProfissionalCard
            key={profissional.id}
            profissional={profissional}
            onAbrir={setProfissionalSelecionado}
          />
        ))}
      </section>

      {novoModalAberto && (
        <ProfissionalNovoModal
          fechar={() => setNovoModalAberto(false)}
          salvar={salvarProfissional}
        />
      )}

      {profissionalSelecionado && (
        <ProfissionalDetalhesModal
          profissional={profissionalSelecionado}
          fechar={() =>
            setProfissionalSelecionado(null)
          }
          alterarStatus={mudarStatusProfissional}
        />
      )}
    </div>
  );
}
