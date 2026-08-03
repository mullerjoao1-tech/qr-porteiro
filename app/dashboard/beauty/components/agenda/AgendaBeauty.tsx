"use client";

import { useEffect, useMemo, useState } from "react";
import AgendaCard from "./AgendaCard";
import AgendaDetalhesModal from "./AgendaDetalhesModal";
import AgendaFiltros from "./AgendaFiltros";
import AgendaIndicadores from "./AgendaIndicadores";
import AgendaNovoModal from "./AgendaNovoModal";
import {
  criarAgendamento,
  observarAgendamentos,
} from "./AgendaFirebase";
import {
  adicionarDias,
  dataEhHoje,
  formatarDataCompleta,
  formatarDataCurta,
  formatarValor,
} from "./AgendaUtils";
import type {
  Agendamento,
  FiltroStatus,
  NovoAgendamento,
} from "./AgendaTypes";

type AgendaBeautyProps = {
  estabelecimentoNome?: string;
};

export default function AgendaBeauty({
  estabelecimentoNome = "Meu salão",
}: AgendaBeautyProps) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");
  const [modalNovoAgendamentoAberto, setModalNovoAgendamentoAberto] =
    useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<Agendamento | null>(null);
  const [agendamentos, setAgendamentos] =
    useState<Agendamento[]>([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(true);
  const [erroAgenda, setErroAgenda] = useState("");

  const dataISO = useMemo(
    () =>
      [
        dataSelecionada.getFullYear(),
        String(dataSelecionada.getMonth() + 1).padStart(2, "0"),
        String(dataSelecionada.getDate()).padStart(2, "0"),
      ].join("-"),
    [dataSelecionada]
  );

  useEffect(() => {
    setCarregandoAgenda(true);
    setErroAgenda("");

    const cancelarObservacao = observarAgendamentos(
      dataISO,
      (dados) => {
        setAgendamentos(dados);
        setCarregandoAgenda(false);
      },
      (erro) => {
        setErroAgenda(erro.message);
        setCarregandoAgenda(false);
      }
    );

    return cancelarObservacao;
  }, [dataISO]);

  async function salvarNovoAgendamento(
    novoAgendamento: NovoAgendamento
  ) {
    await criarAgendamento(novoAgendamento);
  }

  const agendamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return agendamentos.filter((agendamento) => {
      const passaStatus =
        filtroStatus === "todos" || agendamento.status === filtroStatus;

      const passaBusca =
        !termo ||
        [
          agendamento.cliente,
          agendamento.servico,
          agendamento.profissional,
          agendamento.telefone,
        ]
          .join(" ")
          .toLowerCase()
          .includes(termo);

      return passaStatus && passaBusca;
    });
  }, [agendamentos, busca, filtroStatus]);

  const totalConfirmados = agendamentos.filter(
    (agendamento) => agendamento.status === "confirmado"
  ).length;

  const totalAguardando = agendamentos.filter(
    (agendamento) => agendamento.status === "aguardando"
  ).length;

  const totalClientesNovos = agendamentos.filter(
    (agendamento) => agendamento.clienteNovo
  ).length;

  const valorPrevisto = agendamentos.filter(
    (agendamento) =>
      agendamento.status !== "cancelado" &&
      agendamento.status !== "reagendado"
  ).reduce((total, agendamento) => total + agendamento.valor, 0);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-700 via-fuchsia-700 to-purple-700 p-5 shadow-xl md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black text-pink-50 backdrop-blur">
              📅 QR BEAUTY • AGENDA
            </div>

            <h2 className="mt-4 text-3xl font-black md:text-4xl">
              Agenda do salão
            </h2>

            <p className="mt-2 text-sm font-semibold text-pink-100 md:text-base">
              {estabelecimentoNome}
            </p>

            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-pink-100">
              Acompanhe horários, clientes, profissionais, confirmações e o
              andamento dos atendimentos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoAgendamentoAberto(true)}
            className="rounded-2xl bg-white px-5 py-3 font-black text-pink-700 shadow-lg transition-all hover:bg-pink-50 active:scale-95"
          >
            ＋ Novo agendamento
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black text-pink-300">
              DATA SELECIONADA
            </p>

            <h3 className="mt-1 text-xl font-black text-white md:text-2xl">
              {formatarDataCompleta(dataSelecionada)}
            </h3>

            {!dataEhHoje(dataSelecionada) && (
              <p className="mt-1 text-xs font-bold text-slate-500">
                Visualizando a agenda de {formatarDataCurta(dataSelecionada)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:flex">
            <button
              type="button"
              onClick={() =>
                setDataSelecionada((dataAtual) =>
                  adicionarDias(dataAtual, -1)
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-black text-slate-200 transition-all hover:bg-slate-700 active:scale-95"
              aria-label="Dia anterior"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => setDataSelecionada(new Date())}
              className={`rounded-xl border px-5 py-3 font-black transition-all active:scale-95 ${
                dataEhHoje(dataSelecionada)
                  ? "border-pink-500 bg-pink-600 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={() =>
                setDataSelecionada((dataAtual) =>
                  adicionarDias(dataAtual, 1)
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-black text-slate-200 transition-all hover:bg-slate-700 active:scale-95"
              aria-label="Próximo dia"
            >
              →
            </button>
          </div>
        </div>
      </section>

      <AgendaIndicadores
        indicadores={[
          {
            titulo: "AGENDAMENTOS",
            valor: String(agendamentos.length),
            detalhe: "Programados hoje",
            classes: "border-pink-800 bg-pink-950/30 text-pink-300",
          },
          {
            titulo: "CONFIRMADOS",
            valor: String(totalConfirmados),
            detalhe: "Clientes confirmaram",
            classes: "border-green-800 bg-green-950/30 text-green-300",
          },
          {
            titulo: "AGUARDANDO",
            valor: String(totalAguardando),
            detalhe: "Precisam confirmar",
            classes: "border-yellow-800 bg-yellow-950/30 text-yellow-300",
          },
          {
            titulo: "CLIENTES NOVOS",
            valor: String(totalClientesNovos),
            detalhe: "Primeiro atendimento",
            classes: "border-blue-800 bg-blue-950/30 text-blue-300",
          },
        ]}
        valorPrevisto={formatarValor(valorPrevisto)}
      />

      <AgendaFiltros
        busca={busca}
        filtroStatus={filtroStatus}
        onBuscaChange={setBusca}
        onFiltroChange={setFiltroStatus}
        onNovoAgendamento={() => setModalNovoAgendamentoAberto(true)}
      />

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-cyan-300">
              ATENDIMENTOS DO DIA
            </p>

            <h3 className="mt-1 text-2xl font-black text-white">
              Horários agendados
            </h3>
          </div>

          <p className="text-sm font-bold text-slate-400">
            {agendamentosFiltrados.length} atendimento
            {agendamentosFiltrados.length === 1 ? "" : "s"}
          </p>
        </div>

        {carregandoAgenda && (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/50 p-5 text-center text-sm font-bold text-slate-400">
            Carregando agenda...
          </div>
        )}

        {erroAgenda && (
          <div className="mt-5 rounded-2xl border border-red-800 bg-red-950/30 p-4 text-sm font-bold text-red-300">
            {erroAgenda}
          </div>
        )}

        {!carregandoAgenda && agendamentosFiltrados.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
            <div className="text-5xl">📅</div>

            <p className="mt-4 text-lg font-black text-slate-300">
              Nenhum agendamento encontrado
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Ajuste os filtros ou crie um novo agendamento.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {agendamentosFiltrados.map((agendamento) => (
              <AgendaCard
                key={agendamento.id}
                agendamento={agendamento}
                onClick={() => setAgendamentoSelecionado(agendamento)}
              />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setModalNovoAgendamentoAberto(true)}
        className="fixed bottom-5 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-pink-600 text-3xl font-black text-white shadow-2xl transition-all hover:bg-pink-500 active:scale-90 md:hidden"
        aria-label="Novo agendamento"
      >
        ＋
      </button>

      {modalNovoAgendamentoAberto && (
        <AgendaNovoModal
          dataSelecionada={dataSelecionada}
          fechar={() => setModalNovoAgendamentoAberto(false)}
          salvar={salvarNovoAgendamento}
        />
      )}

      {agendamentoSelecionado && (
        <AgendaDetalhesModal
          agendamento={agendamentoSelecionado}
          fechar={() => setAgendamentoSelecionado(null)}
        />
      )}
    </div>
  );
}
