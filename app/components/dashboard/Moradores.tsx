"use client";

import { useMemo, useState } from "react";

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipoLocal: string;
  bloco: string;
  nome: string;
  tipo: string;
  modoChamado?: string;
  status: string;
  possuiResponsavel?: boolean;
  responsavelAdministrativo?: any;
  criadoEm: string;
  atualizadoEm?: string;
};

type MoradorCadastrado = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  email?: string;
  unidadeId: string;
  unidadeNome: string;
  prioridade: number;
  podeAbrirPortao: boolean;
  recebeChamadas?: boolean;
  perfil?: string;
  status: string;
  criadoEm: string;
};

type Props = {
  unidades: UnidadeCadastrada[];
  moradores: MoradorCadastrado[];

  unidadeMoradorId: string;
  setUnidadeMoradorId: (valor: string) => void;

  nomeMorador: string;
  setNomeMorador: (valor: string) => void;

  telefoneMorador: string;
  setTelefoneMorador: (valor: string) => void;

  prioridadeMorador: string;
  setPrioridadeMorador: (valor: string) => void;

  podeAbrirPortao: boolean;
  setPodeAbrirPortao: (valor: boolean) => void;

  cadastrarMorador: () => void;
  salvandoMorador: boolean;
};

export default function Moradores({ unidades, moradores }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroRapido, setFiltroRapido] = useState("todos");
  const [moradorSelecionado, setMoradorSelecionado] =
    useState<MoradorCadastrado | null>(null);

  function textoPerfil(perfil?: string) {
    if (perfil === "familiar") return "Familiar";
    if (perfil === "inquilino") return "Inquilino";
    if (perfil === "proprietario") return "Proprietário";
    if (perfil === "funcionario") return "Funcionário";
    if (perfil === "outro") return "Outro";
    return "Morador";
  }

  function unidadeDoMorador(morador: MoradorCadastrado) {
    return unidades.find((unidade) => unidade.id === morador.unidadeId);
  }

  const moradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return moradores.filter((morador) => {
      const unidade = unidades.find((item) => item.id === morador.unidadeId);

      const textoBusca = [
        morador.nome,
        morador.telefone,
        morador.email || "",
        morador.unidadeNome,
        unidade?.localNome || "",
        unidade?.bloco || "",
        unidade?.nome || "",
        morador.codigo,
        morador.perfil || "",
      ]
        .join(" ")
        .toLowerCase();

      const passaBusca = !termo || textoBusca.includes(termo);

      const passaFiltro =
        filtroRapido === "todos" ||
        (filtroRapido === "ativos" && morador.status === "ativo") ||
        (filtroRapido === "inativos" && morador.status !== "ativo") ||
        (filtroRapido === "proprietarios" &&
          (morador.perfil || "morador") === "proprietario") ||
        (filtroRapido === "inquilinos" &&
          (morador.perfil || "morador") === "inquilino") ||
        (filtroRapido === "familiares" &&
          (morador.perfil || "morador") === "familiar") ||
        (filtroRapido === "funcionarios" &&
          (morador.perfil || "morador") === "funcionario") ||
        (filtroRapido === "recebeChamadas" &&
          morador.recebeChamadas !== false) ||
        (filtroRapido === "abrePortao" && morador.podeAbrirPortao) ||
        (filtroRapido === "semTelefone" && !morador.telefone);

      return passaBusca && passaFiltro;
    });
  }, [busca, filtroRapido, moradores, unidades]);

  const totalAtivos = moradores.filter(
    (morador) => morador.status === "ativo"
  ).length;

  const totalInativos = moradores.filter(
    (morador) => morador.status !== "ativo"
  ).length;

  const totalRecebeChamadas = moradores.filter(
    (morador) => morador.recebeChamadas !== false
  ).length;

  const totalAbrePortao = moradores.filter(
    (morador) => morador.podeAbrirPortao
  ).length;

  const filtros = [
    { id: "todos", nome: "Todos" },
    { id: "ativos", nome: "🟢 Ativos" },
    { id: "inativos", nome: "🔴 Inativos" },
    { id: "proprietarios", nome: "Proprietários" },
    { id: "inquilinos", nome: "Inquilinos" },
    { id: "familiares", nome: "Familiares" },
    { id: "funcionarios", nome: "Funcionários" },
    { id: "recebeChamadas", nome: "🔔 Recebem chamadas" },
    { id: "abrePortao", nome: "🚪 Abrem portão" },
    { id: "semTelefone", nome: "⚠️ Sem telefone" },
  ];

  return (
    <div>
      <h2 className="text-3xl font-black text-blue-300 mb-2">Moradores</h2>

      <p className="text-slate-400 mb-6">
        Consulte, filtre e gerencie todos os moradores cadastrados no QR Central.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-bold">Total</p>
          <p className="text-2xl font-black mt-1">{moradores.length}</p>
        </div>

        <div className="bg-green-950/40 border border-green-800 rounded-2xl p-4">
          <p className="text-xs text-green-300 font-bold">🟢 Ativos</p>
          <p className="text-2xl font-black mt-1">{totalAtivos}</p>
        </div>

        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4">
          <p className="text-xs text-red-300 font-bold">🔴 Inativos</p>
          <p className="text-2xl font-black mt-1">{totalInativos}</p>
        </div>

        <div className="bg-blue-950/40 border border-blue-800 rounded-2xl p-4">
          <p className="text-xs text-blue-300 font-bold">🔔 Recebem chamadas</p>
          <p className="text-2xl font-black mt-1">{totalRecebeChamadas}</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6">
        <h3 className="text-2xl font-bold mb-4">Pesquisar moradores</h3>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone, unidade, condomínio, código..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 mb-4"
        />

        <div className="flex flex-wrap gap-2">
          {filtros.map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => setFiltroRapido(filtro.id)}
              className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${
                filtroRapido === filtro.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {filtro.nome}
            </button>
          ))}
        </div>

        <p className="text-sm text-slate-400 mt-4">
          Exibindo{" "}
          <strong className="text-blue-300">{moradoresFiltrados.length}</strong>{" "}
          de <strong className="text-blue-300">{moradores.length}</strong>{" "}
          morador(es).
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-2xl font-bold">Moradores cadastrados</h3>
            <p className="text-sm text-slate-400 mt-1">
              Clique em um card para abrir as ações do morador.
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {moradoresFiltrados.map((morador) => {
            const unidade = unidadeDoMorador(morador);

            return (
              <button
                key={morador.id}
                onClick={() => setMoradorSelecionado(morador)}
                className="w-full text-left bg-slate-800 hover:bg-slate-750 rounded-xl p-4 border border-slate-700 hover:border-blue-500 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <p className="text-xs text-blue-300 font-bold">
                      {morador.codigo}
                    </p>

                    <h4 className="text-xl font-black">{morador.nome}</h4>

                    <p className="text-sm text-slate-400 mt-1">
                      📱 {morador.telefone || "Sem telefone"}
                    </p>

                    {morador.email && (
                      <p className="text-sm text-slate-400">
                        ✉️ {morador.email}
                      </p>
                    )}

                    <p className="text-sm text-slate-300 mt-2">
                      🏢 {morador.unidadeNome}
                    </p>

                    {unidade && (
                      <p className="text-xs text-slate-500">
                        Código da unidade: {unidade.codigo}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-blue-300 font-bold">
                        Prioridade {morador.prioridade}
                      </span>

                      <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-bold">
                        {textoPerfil(morador.perfil)}
                      </span>

                      <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-green-300 font-bold">
                        {morador.status === "ativo" ? "🟢 Ativo" : "🔴 Inativo"}
                      </span>

                      {morador.recebeChamadas !== false && (
                        <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-cyan-300 font-bold">
                          🔔 Recebe chamadas
                        </span>
                      )}

                      {morador.podeAbrirPortao && (
                        <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-yellow-300 font-bold">
                          🚪 Abre portão
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-bold">
                    Clique para ações
                  </div>
                </div>
              </button>
            );
          })}

          {moradoresFiltrados.length === 0 && (
            <div className="bg-slate-800 rounded-xl p-5 text-slate-400 text-center">
              Nenhum morador encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>

      {moradorSelecionado && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-xl shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-3xl font-black text-blue-300">
                  👤 {moradorSelecionado.nome}
                </h3>

                <p className="text-slate-400 mt-1">
                  {moradorSelecionado.unidadeNome}
                </p>
              </div>

              <button
                onClick={() => setMoradorSelecionado(null)}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  alert(
                    "Próxima etapa: editar morador usando o mesmo formulário da unidade."
                  )
                }
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl"
              >
                ✏️ Editar morador
              </button>

              <button
                onClick={() =>
                  alert(
                    "Próxima etapa: abrir automaticamente a unidade deste morador na aba Unidades."
                  )
                }
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl"
              >
                🏢 Abrir unidade
              </button>

              <button
                onClick={() =>
                  alert("Próxima etapa: desativar este morador no Firebase.")
                }
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl"
              >
                🚫 Desativar
              </button>

              <button
                onClick={() =>
                  alert("Próxima etapa: excluir este morador do Firebase.")
                }
                className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-3 rounded-xl"
              >
                🗑 Excluir
              </button>
            </div>

            <button
              onClick={() => setMoradorSelecionado(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl mt-5"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
