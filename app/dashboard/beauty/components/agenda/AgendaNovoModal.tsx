"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NovoAgendamento } from "./AgendaTypes";
import { formatarDataCompleta } from "./AgendaUtils";
import { observarServicos } from "../servicos/ServicoFirebase";
import { observarProfissionais } from "../profissionais/ProfissionalFirebase";
import { observarClientes } from "../clientes/ClienteFirebase";
import type { ClienteBeauty } from "../clientes/ClienteTypes";

type AgendaNovoModalProps = {
  dataSelecionada: Date;
  fechar: () => void;
  salvar: (agendamento: NovoAgendamento) => Promise<void>;
};

type ServicoAgenda = {
  id: string;
  nome: string;
  valor: number;
  duracaoMinutos: number;
  profissionalIds?: string[];
  status?: "ativo" | "inativo";
};

type ProfissionalAgenda = {
  id: string;
  nome: string;
  status?: "ativo" | "inativo";
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  return telefone;
}

export default function AgendaNovoModal({
  dataSelecionada,
  fechar,
  salvar,
}: AgendaNovoModalProps) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteBeauty | null>(null);
  const [listaClientesAberta, setListaClientesAberta] =
    useState(false);

  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [horario, setHorario] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [clientes, setClientes] = useState<ClienteBeauty[]>([]);
  const [servicos, setServicos] = useState<ServicoAgenda[]>([]);
  const [profissionais, setProfissionais] = useState<
    ProfissionalAgenda[]
  >([]);

  const [carregandoCadastros, setCarregandoCadastros] =
    useState(true);
  const [erroCadastros, setErroCadastros] = useState("");

  useEffect(() => {
    let clientesCarregados = false;
    let servicosCarregados = false;
    let profissionaisCarregados = false;

    function finalizarCarregamento() {
      if (
        clientesCarregados &&
        servicosCarregados &&
        profissionaisCarregados
      ) {
        setCarregandoCadastros(false);
      }
    }

    const pararClientes = observarClientes(
      (lista) => {
        setClientes(
          lista.filter((item) => item.status !== "inativo")
        );
        clientesCarregados = true;
        finalizarCarregamento();
      },
      (erro) => {
        console.error(erro);
        setErroCadastros(
          "Não foi possível carregar os clientes."
        );
        clientesCarregados = true;
        finalizarCarregamento();
      }
    );

    const pararServicos = observarServicos(
      (lista) => {
        setServicos(
          (lista as ServicoAgenda[]).filter(
            (item) => item.status !== "inativo"
          )
        );
        servicosCarregados = true;
        finalizarCarregamento();
      },
      (erro) => {
        console.error(erro);
        setErroCadastros(
          "Não foi possível carregar os serviços."
        );
        servicosCarregados = true;
        finalizarCarregamento();
      }
    );

    const pararProfissionais = observarProfissionais(
      (lista) => {
        setProfissionais(
          (lista as ProfissionalAgenda[]).filter(
            (item) => item.status !== "inativo"
          )
        );
        profissionaisCarregados = true;
        finalizarCarregamento();
      },
      (erro) => {
        console.error(erro);
        setErroCadastros(
          "Não foi possível carregar os profissionais."
        );
        profissionaisCarregados = true;
        finalizarCarregamento();
      }
    );

    return () => {
      pararClientes();
      pararServicos();
      pararProfissionais();
    };
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = cliente.trim().toLowerCase();
    const telefoneDigitado = cliente.replace(/\D/g, "");

    if (!termo || clienteSelecionado) {
      return [];
    }

    return clientes
      .filter((item) => {
        const nomeCorresponde = item.nome
          .toLowerCase()
          .includes(termo);

        const telefoneCorresponde =
          telefoneDigitado.length > 0 &&
          item.telefoneNormalizado.includes(
            telefoneDigitado
          );

        return nomeCorresponde || telefoneCorresponde;
      })
      .slice(0, 6);
  }, [cliente, clienteSelecionado, clientes]);

  const servicoSelecionado = useMemo(
    () =>
      servicos.find((servico) => servico.id === servicoId) ??
      null,
    [servicos, servicoId]
  );

  const profissionaisDisponiveis = useMemo(() => {
    if (!servicoSelecionado) {
      return profissionais;
    }

    const idsVinculados =
      servicoSelecionado.profissionalIds ?? [];

    if (idsVinculados.length === 0) {
      return profissionais;
    }

    return profissionais.filter((profissional) =>
      idsVinculados.includes(profissional.id)
    );
  }, [profissionais, servicoSelecionado]);

  useEffect(() => {
    if (
      profissionalId &&
      !profissionaisDisponiveis.some(
        (profissional) => profissional.id === profissionalId
      )
    ) {
      setProfissionalId("");
    }
  }, [profissionalId, profissionaisDisponiveis]);

  function selecionarCliente(item: ClienteBeauty) {
    setClienteSelecionado(item);
    setCliente(item.nome);
    setTelefone(formatarTelefone(item.telefone));
    setListaClientesAberta(false);

    if (item.observacoes && !observacoes.trim()) {
      setObservacoes(item.observacoes);
    }
  }

  function limparClienteSelecionado() {
    setClienteSelecionado(null);
    setCliente("");
    setTelefone("");
    setListaClientesAberta(false);
  }

  function alterarBuscaCliente(valor: string) {
    setClienteSelecionado(null);
    setCliente(valor);
    setListaClientesAberta(true);
  }

  function selecionarServico(novoServicoId: string) {
    setServicoId(novoServicoId);
    setProfissionalId("");
  }

  async function salvarAgendamento() {
    if (!cliente.trim()) {
      alert("Digite ou selecione o cliente.");
      return;
    }

    if (!telefone.trim()) {
      alert("Digite o telefone do cliente.");
      return;
    }

    if (!servicoSelecionado) {
      alert("Selecione o serviço.");
      return;
    }

    const profissionalSelecionado =
      profissionaisDisponiveis.find(
        (profissional) =>
          profissional.id === profissionalId
      );

    if (!profissionalSelecionado) {
      alert("Selecione o profissional.");
      return;
    }

    if (!horario) {
      alert("Selecione o horário.");
      return;
    }

    const dataISO = [
      dataSelecionada.getFullYear(),
      String(dataSelecionada.getMonth() + 1).padStart(2, "0"),
      String(dataSelecionada.getDate()).padStart(2, "0"),
    ].join("-");

    setSalvando(true);

    try {
      await salvar({
        dataISO,
        horario,
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        servico: servicoSelecionado.nome,
        profissional: profissionalSelecionado.nome,
        duracaoMinutos:
          Number(servicoSelecionado.duracaoMinutos) || 60,
        valor: Number(servicoSelecionado.valor) || 0,
        status: "aguardando",
        observacoes: observacoes.trim() || undefined,
        origem: "painel",
      });

      alert("Agendamento salvo com sucesso.");
      fechar();
    } catch (erro) {
      console.error(erro);

      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar o agendamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 md:p-6">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-pink-300">
              ＋ NOVO AGENDAMENTO
            </p>

            <h3 className="mt-1 text-2xl font-black text-white">
              Agendar atendimento
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Data selecionada:{" "}
              {formatarDataCompleta(dataSelecionada)}
            </p>
          </div>

          <button
            type="button"
            onClick={fechar}
            disabled={salvando}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-50"
            aria-label="Fechar novo agendamento"
          >
            ✕
          </button>
        </div>

        {erroCadastros && (
          <div className="mt-4 rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm font-bold text-red-300">
            {erroCadastros}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <CampoFormulario titulo="Cliente">
            <div className="relative">
              <input
                value={cliente}
                onChange={(event) =>
                  alterarBuscaCliente(event.target.value)
                }
                onFocus={() => {
                  if (!clienteSelecionado) {
                    setListaClientesAberta(true);
                  }
                }}
                placeholder="Digite o nome ou telefone"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 text-white outline-none placeholder:text-slate-500 focus:border-pink-500"
              />

              {clienteSelecionado && (
                <button
                  type="button"
                  onClick={limparClienteSelecionado}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-slate-700 px-2 py-1 text-xs font-black text-white"
                  title="Trocar cliente"
                >
                  ✕
                </button>
              )}

              {listaClientesAberta &&
                clientesFiltrados.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
                    {clientesFiltrados.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          selecionarCliente(item)
                        }
                        className="block w-full border-b border-slate-800 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-800"
                      >
                        <p className="font-black text-white">
                          {item.nome}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {formatarTelefone(item.telefone)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </CampoFormulario>

          {clienteSelecionado && (
            <div className="rounded-2xl border border-emerald-800 bg-emerald-950/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-emerald-300">
                    Cliente cadastrado
                  </p>

                  <p className="mt-1 text-lg font-black text-white">
                    {clienteSelecionado.nome}
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {formatarTelefone(
                      clienteSelecionado.telefone
                    )}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                  Selecionado
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-500">
                    Visitas
                  </p>

                  <p className="mt-1 font-black text-white">
                    {clienteSelecionado.totalVisitas}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-500">
                    Valor gerado
                  </p>

                  <p className="mt-1 font-black text-white">
                    {formatarMoeda(
                      clienteSelecionado.valorTotalGasto
                    )}
                  </p>
                </div>
              </div>

              {clienteSelecionado.ultimaVisita && (
                <p className="mt-3 text-xs text-slate-400">
                  Última visita:{" "}
                  {clienteSelecionado.ultimaVisita}
                </p>
              )}
            </div>
          )}

          <CampoFormulario titulo="Telefone ou WhatsApp">
            <input
              value={telefone}
              onChange={(event) =>
                setTelefone(event.target.value)
              }
              placeholder="(41) 99999-9999"
              inputMode="tel"
              disabled={Boolean(clienteSelecionado)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-pink-500 disabled:opacity-70"
            />
          </CampoFormulario>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoFormulario titulo="Serviço">
              <select
                value={servicoId}
                onChange={(event) =>
                  selecionarServico(event.target.value)
                }
                disabled={carregandoCadastros}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-pink-500 disabled:opacity-60"
              >
                <option value="">
                  {carregandoCadastros
                    ? "Carregando..."
                    : "Selecione"}
                </option>

                {servicos.map((servico) => (
                  <option
                    key={servico.id}
                    value={servico.id}
                  >
                    {servico.nome}
                  </option>
                ))}
              </select>
            </CampoFormulario>

            <CampoFormulario titulo="Profissional">
              <select
                value={profissionalId}
                onChange={(event) =>
                  setProfissionalId(event.target.value)
                }
                disabled={
                  carregandoCadastros || !servicoSelecionado
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-pink-500 disabled:opacity-60"
              >
                <option value="">
                  {!servicoSelecionado
                    ? "Escolha o serviço primeiro"
                    : profissionaisDisponiveis.length === 0
                    ? "Nenhum profissional disponível"
                    : "Selecione"}
                </option>

                {profissionaisDisponiveis.map(
                  (profissional) => (
                    <option
                      key={profissional.id}
                      value={profissional.id}
                    >
                      {profissional.nome}
                    </option>
                  )
                )}
              </select>
            </CampoFormulario>
          </div>

          {servicoSelecionado && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-pink-900 bg-pink-950/30 p-3">
                <p className="text-[10px] font-black uppercase text-pink-300">
                  Valor
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  {formatarMoeda(
                    Number(servicoSelecionado.valor) || 0
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-violet-900 bg-violet-950/30 p-3">
                <p className="text-[10px] font-black uppercase text-violet-300">
                  Duração
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  {Number(
                    servicoSelecionado.duracaoMinutos
                  ) || 60}{" "}
                  min
                </p>
              </div>
            </div>
          )}

          <CampoFormulario titulo="Horário">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
                "18:00",
              ].map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setHorario(opcao)}
                  className={`rounded-xl border px-3 py-3 text-sm font-black transition-all ${
                    horario === opcao
                      ? "border-pink-500 bg-pink-600 text-white"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </CampoFormulario>

          <CampoFormulario titulo="Observações">
            <textarea
              value={observacoes}
              onChange={(event) =>
                setObservacoes(event.target.value)
              }
              placeholder="Preferências, informações importantes ou observações..."
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-pink-500"
            />
          </CampoFormulario>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={fechar}
              disabled={salvando}
              className="rounded-xl bg-slate-700 py-3 font-black text-white transition-all hover:bg-slate-600 active:scale-95 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvarAgendamento}
              disabled={salvando || carregandoCadastros}
              className="rounded-xl bg-pink-600 py-3 font-black text-white transition-all hover:bg-pink-500 active:scale-95 disabled:bg-slate-600"
            >
              {salvando
                ? "Salvando..."
                : "Confirmar agendamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type CampoFormularioProps = {
  titulo: string;
  children: ReactNode;
};

function CampoFormulario({
  titulo,
  children,
}: CampoFormularioProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-300">
        {titulo}
      </span>

      {children}
    </label>
  );
}
