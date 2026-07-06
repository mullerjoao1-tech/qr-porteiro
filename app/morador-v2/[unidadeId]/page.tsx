"use client";

import { useState } from "react";

type LocalCadastrado = {
  id: string;
  nome: string;
  tipo: string;
};

type ResponsavelAdministrativo = {
  nome: string;
  telefone: string;
  email: string;
  podeSolicitarAlteracaoStatus: boolean;
};

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipoLocal: string;
  tipo: string;
  bloco: string;
  nome: string;
  modoChamado?: string;
  status: string;
  possuiResponsavel?: boolean;
  responsavelAdministrativo?: ResponsavelAdministrativo | null;
  criadoEm: string;
  atualizadoEm?: string;
};

type MoradorCadastrado = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  unidadeId: string;
  unidadeNome: string;
  prioridade: number;
  podeAbrirPortao: boolean;
  status: string;
  criadoEm: string;
};

type Props = {
  locais: LocalCadastrado[];
  unidades: UnidadeCadastrada[];
  moradores: MoradorCadastrado[];

  localSelecionadoId: string;
  setLocalSelecionadoId: (valor: string) => void;

  blocoUnidade: string;
  setBlocoUnidade: (valor: string) => void;

  nomeUnidade: string;
  setNomeUnidade: (valor: string) => void;

  tipoUnidade: string;
  setTipoUnidade: (valor: string) => void;

  modoChamadoUnidade: string;
  setModoChamadoUnidade: (valor: string) => void;

  statusUnidade: string;
  setStatusUnidade: (valor: string) => void;

  possuiResponsavel: boolean;
  setPossuiResponsavel: (valor: boolean) => void;

  nomeResponsavel: string;
  setNomeResponsavel: (valor: string) => void;

  telefoneResponsavel: string;
  setTelefoneResponsavel: (valor: string) => void;

  emailResponsavel: string;
  setEmailResponsavel: (valor: string) => void;

  loteAberto: boolean;
  setLoteAberto: (valor: boolean) => void;

  loteLocalSelecionadoId: string;
  setLoteLocalSelecionadoId: (valor: string) => void;

  textoLoteUnidades: string;
  setTextoLoteUnidades: (valor: string) => void;

  blocoLote: string;
  setBlocoLote: (valor: string) => void;

  tipoLote: string;
  setTipoLote: (valor: string) => void;

  modoChamadoLote: string;
  setModoChamadoLote: (valor: string) => void;

  statusLote: string;
  setStatusLote: (valor: string) => void;

  cadastrarUnidadesEmLote: () => void;
  salvandoLote: boolean;

  editandoUnidade: UnidadeCadastrada | null;
  abrirEdicaoUnidade: (unidade: UnidadeCadastrada) => void;
  fecharEdicaoUnidade: () => void;
  salvarEdicaoUnidade: () => void;
  salvandoEdicaoUnidade: boolean;

  editBlocoUnidade: string;
  setEditBlocoUnidade: (valor: string) => void;

  editNomeUnidade: string;
  setEditNomeUnidade: (valor: string) => void;

  editTipoUnidade: string;
  setEditTipoUnidade: (valor: string) => void;

  editModoChamadoUnidade: string;
  setEditModoChamadoUnidade: (valor: string) => void;

  editStatusUnidade: string;
  setEditStatusUnidade: (valor: string) => void;

  editPossuiResponsavel: boolean;
  setEditPossuiResponsavel: (valor: boolean) => void;

  editNomeResponsavel: string;
  setEditNomeResponsavel: (valor: string) => void;

  editTelefoneResponsavel: string;
  setEditTelefoneResponsavel: (valor: string) => void;

  editEmailResponsavel: string;
  setEditEmailResponsavel: (valor: string) => void;

  excluirUnidade: (unidade: UnidadeCadastrada) => void;
  desativarUnidade: (unidade: UnidadeCadastrada) => void;

  modoCondominio: boolean;
  cadastrarUnidade: () => void;
  salvandoUnidade: boolean;
};

export default function Unidades({
  locais,
  unidades,
  moradores,
  localSelecionadoId,
  setLocalSelecionadoId,
  blocoUnidade,
  setBlocoUnidade,
  nomeUnidade,
  setNomeUnidade,
  tipoUnidade,
  setTipoUnidade,
  modoChamadoUnidade,
  setModoChamadoUnidade,
  statusUnidade,
  setStatusUnidade,
  possuiResponsavel,
  setPossuiResponsavel,
  nomeResponsavel,
  setNomeResponsavel,
  telefoneResponsavel,
  setTelefoneResponsavel,
  emailResponsavel,
  setEmailResponsavel,
  loteAberto,
  setLoteAberto,
  loteLocalSelecionadoId,
  setLoteLocalSelecionadoId,
  textoLoteUnidades,
  setTextoLoteUnidades,
  blocoLote,
  setBlocoLote,
  tipoLote,
  setTipoLote,
  modoChamadoLote,
  setModoChamadoLote,
  statusLote,
  setStatusLote,
  cadastrarUnidadesEmLote,
  salvandoLote,
  editandoUnidade,
  abrirEdicaoUnidade,
  fecharEdicaoUnidade,
  salvarEdicaoUnidade,
  salvandoEdicaoUnidade,
  editBlocoUnidade,
  setEditBlocoUnidade,
  editNomeUnidade,
  setEditNomeUnidade,
  editTipoUnidade,
  setEditTipoUnidade,
  editModoChamadoUnidade,
  setEditModoChamadoUnidade,
  editStatusUnidade,
  setEditStatusUnidade,
  editPossuiResponsavel,
  setEditPossuiResponsavel,
  editNomeResponsavel,
  setEditNomeResponsavel,
  editTelefoneResponsavel,
  setEditTelefoneResponsavel,
  editEmailResponsavel,
  setEditEmailResponsavel,
  excluirUnidade,
  desativarUnidade,
  modoCondominio,
  cadastrarUnidade,
  salvandoUnidade,
}: Props) {
  const [unidadeMoradoresAberta, setUnidadeMoradoresAberta] =
    useState<UnidadeCadastrada | null>(null);

  function textoModoChamado(modo?: string) {
    if (modo === "prioridade") return "Modo Prioridade";
    return "Modo Família";
  }

  function textoStatus(status?: string) {
    if (status === "ativa") return "🟢 Ativa";
    if (status === "desativada") return "🔴 Desativada";
    return "🟡 Pendente";
  }

  function corStatus(status?: string) {
    if (status === "ativa") return "text-green-300";
    if (status === "desativada") return "text-red-300";
    return "text-yellow-300";
  }

  function quantidadePreviewLote() {
    return textoLoteUnidades
      .split(/[\n,; ]+/)
      .map((item) => item.trim())
      .filter(Boolean).length;
  }

  const unidadesFiltradas = localSelecionadoId
    ? unidades.filter((unidade) => unidade.localId === localSelecionadoId)
    : unidades;

  const totalAtivas = unidadesFiltradas.filter(
    (unidade) => unidade.status === "ativa"
  ).length;

  const totalPendentes = unidadesFiltradas.filter(
    (unidade) => unidade.status === "pendente" || !unidade.status
  ).length;

  const totalDesativadas = unidadesFiltradas.filter(
    (unidade) => unidade.status === "desativada"
  ).length;

  function moradoresDaUnidade(unidadeId: string) {
    return moradores.filter((morador) => morador.unidadeId === unidadeId);
  }

  function localDaUnidade(unidade: UnidadeCadastrada) {
    return locais.find((local) => local.id === unidade.localId);
  }

  function unidadeEditadaEhCondominio() {
    if (!editandoUnidade) return modoCondominio;
    const local = localDaUnidade(editandoUnidade);
    return local?.tipo === "condominio";
  }

  const localSelecionadoParaLote = locais.find(
    (local) => local.id === loteLocalSelecionadoId
  );

  const modoCondominioLote = localSelecionadoParaLote?.tipo === "condominio";

  function textoTipo(tipo: string) {
    const tipos: any = {
      apartamento: "Apartamento",
      sala: "Sala",
      loja: "Loja",
      livre: "Livre",
      casa: "Casa",
      quarto: "Quarto",
      chale: "Chalé",
    };

    return tipos[tipo] || tipo;
  }

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-3xl font-black text-blue-300">Unidades</h2>
          <p className="text-slate-400 mt-2">
            Cadastre apartamentos, casas, salas, lojas, quartos ou chalés.
          </p>
        </div>

        <button
          onClick={() => setLoteAberto(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-5 py-3 rounded-xl shadow-lg"
        >
          🚀 Cadastro em lote
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-bold">Total</p>
          <p className="text-2xl font-black mt-1">{unidadesFiltradas.length}</p>
        </div>

        <div className="bg-green-950/40 border border-green-800 rounded-2xl p-4">
          <p className="text-xs text-green-300 font-bold">🟢 Ativas</p>
          <p className="text-2xl font-black mt-1">{totalAtivas}</p>
        </div>

        <div className="bg-yellow-950/40 border border-yellow-800 rounded-2xl p-4">
          <p className="text-xs text-yellow-300 font-bold">🟡 Pendentes</p>
          <p className="text-2xl font-black mt-1">{totalPendentes}</p>
        </div>

        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4">
          <p className="text-xs text-red-300 font-bold">🔴 Desativadas</p>
          <p className="text-2xl font-black mt-1">{totalDesativadas}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Cadastrar unidade</h3>

          <div className="space-y-4">
            <select
              value={localSelecionadoId}
              onChange={(e) => setLocalSelecionadoId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="">Selecione o local</option>

              {locais.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nome}
                </option>
              ))}
            </select>

            {modoCondominio && (
              <input
                value={blocoUnidade}
                onChange={(e) => setBlocoUnidade(e.target.value)}
                placeholder="Bloco ou torre. Ex: Bloco A"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              />
            )}

            <input
              value={nomeUnidade}
              onChange={(e) => setNomeUnidade(e.target.value)}
              placeholder={
                modoCondominio
                  ? "Número da unidade. Ex: 101"
                  : "Nome livre"
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            />

            <select
              value={tipoUnidade}
              onChange={(e) => setTipoUnidade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              {modoCondominio ? (
                <>
                  <option value="apartamento">Apartamento</option>
                  <option value="sala">Sala</option>
                  <option value="loja">Loja</option>
                </>
              ) : (
                <>
                  <option value="livre">Livre</option>
                  <option value="casa">Casa</option>
                  <option value="quarto">Quarto</option>
                  <option value="chale">Chalé</option>
                </>
              )}
            </select>

            <select
              value={modoChamadoUnidade}
              onChange={(e) => setModoChamadoUnidade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="familia">Modo Família — todos juntos</option>
              <option value="prioridade">Modo Prioridade — em fila</option>
            </select>

            <select
              value={statusUnidade}
              onChange={(e) => setStatusUnidade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="pendente">🟡 Pendente — sem morador cadastrado</option>
              <option value="ativa">🟢 Ativa — pronta para receber chamadas</option>
              <option value="desativada">🔴 Desativada — vazia, bloqueada ou em reforma</option>
            </select>

            <label className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={possuiResponsavel}
                onChange={(e) => setPossuiResponsavel(e.target.checked)}
                className="mt-1"
              />

              <div>
                <p className="font-bold text-white">
                  Possui responsável administrativo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Use apenas para unidade de aluguel, Airbnb, imobiliária ou
                  quando alguém diferente do morador administra a unidade.
                </p>
              </div>
            </label>

            {possuiResponsavel && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-blue-300">
                  Responsável administrativo da unidade
                </h4>

                <input
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Nome do responsável. Ex: Carlos Silva"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                />

                <input
                  value={telefoneResponsavel}
                  onChange={(e) => setTelefoneResponsavel(e.target.value)}
                  placeholder="Telefone / WhatsApp"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                />

                <input
                  value={emailResponsavel}
                  onChange={(e) => setEmailResponsavel(e.target.value)}
                  placeholder="E-mail"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                />
              </div>
            )}

            <button
              onClick={cadastrarUnidade}
              disabled={salvandoUnidade}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
            >
              {salvandoUnidade ? "Salvando..." : "Cadastrar unidade"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Unidades cadastradas</h3>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {unidadesFiltradas.map((unidade) => {
              const moradoresVinculados = moradoresDaUnidade(unidade.id);

              return (
                <div
                  key={unidade.id}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-blue-300 font-bold">
                        {unidade.codigo}
                      </p>

                      <h4 className="text-lg font-black">
                        {unidade.bloco
                          ? `${unidade.bloco} / ${unidade.nome}`
                          : unidade.nome}
                      </h4>
                    </div>

                    <span
                      className={`text-xs md:text-sm font-black px-3 py-1 rounded-full bg-slate-900 border border-slate-700 ${corStatus(
                        unidade.status
                      )}`}
                    >
                      {textoStatus(unidade.status)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mt-1">
                    {unidade.localNome} • {textoTipo(unidade.tipo)}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-green-300 font-bold">
                      {textoModoChamado(unidade.modoChamado)}
                    </span>

                    <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-blue-300 font-bold">
                      👥 {moradoresVinculados.length} morador(es)
                    </span>
                  </div>

                  {moradoresVinculados.length > 0 && (
                    <div className="mt-3 bg-slate-900 rounded-xl p-3 border border-slate-700">
                      <p className="text-xs text-blue-300 font-bold mb-2">
                        Moradores vinculados
                      </p>

                      <div className="space-y-1">
                        {moradoresVinculados.slice(0, 3).map((morador) => (
                          <p
                            key={morador.id}
                            className="text-xs text-slate-300"
                          >
                            📱 {morador.nome}{" "}
                            <span className="text-slate-500">
                              • Prioridade {morador.prioridade}
                            </span>
                          </p>
                        ))}

                        {moradoresVinculados.length > 3 && (
                          <p className="text-xs text-slate-500">
                            + {moradoresVinculados.length - 3} outro(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {unidade.possuiResponsavel &&
                    unidade.responsavelAdministrativo && (
                      <div className="mt-3 bg-slate-900 rounded-xl p-3 border border-slate-700">
                        <p className="text-xs text-blue-300 font-bold mb-1">
                          Responsável administrativo
                        </p>

                        <p className="text-sm font-bold">
                          {unidade.responsavelAdministrativo.nome}
                        </p>

                        {unidade.responsavelAdministrativo.telefone && (
                          <p className="text-xs text-slate-400 mt-1">
                            WhatsApp:{" "}
                            {unidade.responsavelAdministrativo.telefone}
                          </p>
                        )}

                        {unidade.responsavelAdministrativo.email && (
                          <p className="text-xs text-slate-400">
                            E-mail: {unidade.responsavelAdministrativo.email}
                          </p>
                        )}
                      </div>
                    )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    <button
                      onClick={() => setUnidadeMoradoresAberta(unidade)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-2 rounded-xl"
                    >
                      👥 Moradores
                    </button>

                    <button
                      onClick={() => abrirEdicaoUnidade(unidade)}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-black py-2 rounded-xl"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => desativarUnidade(unidade)}
                      disabled={unidade.status === "desativada"}
                      className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-black py-2 rounded-xl"
                    >
                      🔴 Desativar
                    </button>

                    <button
                      onClick={() => excluirUnidade(unidade)}
                      className="bg-red-700 hover:bg-red-600 text-white text-xs font-black py-2 rounded-xl"
                    >
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              );
            })}

            {unidadesFiltradas.length === 0 && (
              <div className="bg-slate-800 rounded-xl p-4 text-slate-400">
                Nenhuma unidade cadastrada para este local.
              </div>
            )}
          </div>
        </div>
      </div>

      {loteAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-3xl font-black text-cyan-300">
                  Cadastro em lote
                </h3>
                <p className="text-slate-400 mt-1">
                  Crie várias unidades de uma vez. Uma por linha, separadas por
                  vírgula ou espaço.
                </p>
              </div>

              <button
                onClick={() => setLoteAberto(false)}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <select
                value={loteLocalSelecionadoId}
                onChange={(e) => setLoteLocalSelecionadoId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              >
                <option value="">Selecione o local</option>

                {locais.map((local) => (
                  <option key={local.id} value={local.id}>
                    {local.nome}
                  </option>
                ))}
              </select>

              {modoCondominioLote && (
                <input
                  value={blocoLote}
                  onChange={(e) => setBlocoLote(e.target.value)}
                  placeholder="Bloco ou torre. Ex: Bloco A"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                />
              )}

              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={tipoLote}
                  onChange={(e) => setTipoLote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  {modoCondominioLote ? (
                    <>
                      <option value="apartamento">Apartamento</option>
                      <option value="sala">Sala</option>
                      <option value="loja">Loja</option>
                    </>
                  ) : (
                    <>
                      <option value="livre">Livre</option>
                      <option value="casa">Casa</option>
                      <option value="quarto">Quarto</option>
                      <option value="chale">Chalé</option>
                    </>
                  )}
                </select>

                <select
                  value={modoChamadoLote}
                  onChange={(e) => setModoChamadoLote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="familia">Modo Família</option>
                  <option value="prioridade">Modo Prioridade</option>
                </select>

                <select
                  value={statusLote}
                  onChange={(e) => setStatusLote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="pendente">🟡 Pendente</option>
                  <option value="ativa">🟢 Ativa</option>
                  <option value="desativada">🔴 Desativada</option>
                </select>
              </div>

              <textarea
                value={textoLoteUnidades}
                onChange={(e) => setTextoLoteUnidades(e.target.value)}
                placeholder={`Cole aqui as unidades. Ex:\n101\n102\n103\n104\n105`}
                rows={10}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 font-mono"
              />

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-sm text-slate-300">
                  Prévia:{" "}
                  <strong className="text-cyan-300">
                    {quantidadePreviewLote()} unidade(s)
                  </strong>{" "}
                  detectada(s).
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => setLoteAberto(false)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  onClick={cadastrarUnidadesEmLote}
                  disabled={salvandoLote}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
                >
                  {salvandoLote
                    ? "Criando unidades..."
                    : `Criar ${quantidadePreviewLote()} unidade(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editandoUnidade && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-3xl font-black text-blue-300">
                  Editar unidade
                </h3>
                <p className="text-slate-400 mt-1">
                  {editandoUnidade.localNome} •{" "}
                  {editandoUnidade.bloco
                    ? `${editandoUnidade.bloco} / ${editandoUnidade.nome}`
                    : editandoUnidade.nome}
                </p>
              </div>

              <button
                onClick={fecharEdicaoUnidade}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {unidadeEditadaEhCondominio() && (
                <input
                  value={editBlocoUnidade}
                  onChange={(e) => setEditBlocoUnidade(e.target.value)}
                  placeholder="Bloco ou torre. Ex: Bloco A"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                />
              )}

              <input
                value={editNomeUnidade}
                onChange={(e) => setEditNomeUnidade(e.target.value)}
                placeholder={
                  unidadeEditadaEhCondominio()
                    ? "Número da unidade. Ex: 101"
                    : "Nome livre"
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              />

              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={editTipoUnidade}
                  onChange={(e) => setEditTipoUnidade(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  {unidadeEditadaEhCondominio() ? (
                    <>
                      <option value="apartamento">Apartamento</option>
                      <option value="sala">Sala</option>
                      <option value="loja">Loja</option>
                    </>
                  ) : (
                    <>
                      <option value="livre">Livre</option>
                      <option value="casa">Casa</option>
                      <option value="quarto">Quarto</option>
                      <option value="chale">Chalé</option>
                    </>
                  )}
                </select>

                <select
                  value={editModoChamadoUnidade}
                  onChange={(e) => setEditModoChamadoUnidade(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="familia">Modo Família</option>
                  <option value="prioridade">Modo Prioridade</option>
                </select>

                <select
                  value={editStatusUnidade}
                  onChange={(e) => setEditStatusUnidade(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="pendente">🟡 Pendente</option>
                  <option value="ativa">🟢 Ativa</option>
                  <option value="desativada">🔴 Desativada</option>
                </select>
              </div>

              <label className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editPossuiResponsavel}
                  onChange={(e) =>
                    setEditPossuiResponsavel(e.target.checked)
                  }
                  className="mt-1"
                />

                <div>
                  <p className="font-bold text-white">
                    Possui responsável administrativo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Use para aluguel, Airbnb, imobiliária ou quando alguém
                    diferente do morador administra a unidade.
                  </p>
                </div>
              </label>

              {editPossuiResponsavel && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-blue-300">
                    Responsável administrativo da unidade
                  </h4>

                  <input
                    value={editNomeResponsavel}
                    onChange={(e) =>
                      setEditNomeResponsavel(e.target.value)
                    }
                    placeholder="Nome do responsável"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                  />

                  <input
                    value={editTelefoneResponsavel}
                    onChange={(e) =>
                      setEditTelefoneResponsavel(e.target.value)
                    }
                    placeholder="Telefone / WhatsApp"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                  />

                  <input
                    value={editEmailResponsavel}
                    onChange={(e) =>
                      setEditEmailResponsavel(e.target.value)
                    }
                    placeholder="E-mail"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                  />
                </div>
              )}

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-sm text-slate-300">
                  Moradores vinculados:{" "}
                  <strong className="text-blue-300">
                    {moradoresDaUnidade(editandoUnidade.id).length}
                  </strong>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Para excluir a unidade, ela não pode ter moradores vinculados.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={fecharEdicaoUnidade}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarEdicaoUnidade}
                  disabled={salvandoEdicaoUnidade}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
                >
                  {salvandoEdicaoUnidade
                    ? "Salvando alterações..."
                    : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
