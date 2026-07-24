"use client";

import { useEffect, useMemo, useState } from "react";
import ClienteCard from "./ClienteCard";
import ClienteDetalhesModal from "./ClienteDetalhesModal";
import ClienteFiltros from "./ClienteFiltros";
import {
  alterarStatusCliente,
  criarCliente,
  observarClientes,
} from "./ClienteFirebase";
import ClienteIndicadores from "./ClienteIndicadores";
import ClienteNovoModal from "./ClienteNovoModal";
import type {
  ClienteBeauty as ClienteBeautyType,
  FiltroStatusCliente,
  NovoClienteBeauty,
} from "./ClienteTypes";

export default function ClienteBeauty() {
  const [clientes, setClientes] = useState<ClienteBeautyType[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusCliente>("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novoModalAberto, setNovoModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteBeautyType | null>(null);

  useEffect(() => {
    const cancelar = observarClientes(
      (dados) => {
        setClientes(dados);
        setCarregando(false);
      },
      (erroRecebido) => {
        setErro(erroRecebido.message);
        setCarregando(false);
      }
    );

    return cancelar;
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const correspondeStatus =
        filtroStatus === "todos" ||
        cliente.status === filtroStatus;

      const correspondeBusca =
        !termo ||
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.telefoneNormalizado.includes(
          termo.replace(/\D/g, "")
        );

      return correspondeStatus && correspondeBusca;
    });
  }, [busca, clientes, filtroStatus]);

  const ativos = clientes.filter(
    (cliente) => cliente.status === "ativo"
  ).length;

  const inativos = clientes.filter(
    (cliente) => cliente.status === "inativo"
  ).length;

  const visitas = clientes.reduce(
    (total, cliente) => total + cliente.totalVisitas,
    0
  );

  const faturamento = clientes.reduce(
    (total, cliente) => total + cliente.valorTotalGasto,
    0
  );

  async function salvarCliente(
    novoCliente: NovoClienteBeauty
  ) {
    await criarCliente(novoCliente);
  }

  async function mudarStatus(
    clienteId: string,
    status: "ativo" | "inativo"
  ) {
    await alterarStatusCliente(clienteId, status);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-300">
          QR Beauty
        </p>
        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
          Clientes
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Cadastro, relacionamento e histórico dos clientes.
        </p>
      </div>

      <ClienteIndicadores
        total={clientes.length}
        ativos={ativos}
        inativos={inativos}
        visitas={visitas}
        faturamento={faturamento}
      />

      <ClienteFiltros
        busca={busca}
        filtroStatus={filtroStatus}
        onBuscaChange={setBusca}
        onFiltroChange={setFiltroStatus}
        onNovoCliente={() => setNovoModalAberto(true)}
      />

      {carregando && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center font-bold text-slate-400">
          Carregando clientes...
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 font-bold text-red-300">
          {erro}
        </div>
      )}

      {!carregando && clientesFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <p className="text-lg font-black text-white">
            Nenhum cliente encontrado
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Cadastre o primeiro cliente ou ajuste os filtros.
          </p>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clientesFiltrados.map((cliente) => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            onAbrir={setClienteSelecionado}
          />
        ))}
      </section>

      {novoModalAberto && (
        <ClienteNovoModal
          fechar={() => setNovoModalAberto(false)}
          salvar={salvarCliente}
        />
      )}

      {clienteSelecionado && (
        <ClienteDetalhesModal
          cliente={clienteSelecionado}
          fechar={() => setClienteSelecionado(null)}
          alterarStatus={mudarStatus}
        />
      )}
    </div>
  );
}
