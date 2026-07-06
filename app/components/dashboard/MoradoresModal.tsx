"use client";

import { useState } from "react";
import NovoMoradorModal from "./NovoMoradorModal";

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
  unidade: UnidadeCadastrada;
  moradores: MoradorCadastrado[];
  onClose: () => void;
};

export default function MoradoresModal({
  unidade,
  moradores,
  onClose,
}: Props) {
  const [abrirNovoMorador, setAbrirNovoMorador] = useState(false);

  const moradoresDaUnidade = moradores
    .filter((morador) => morador.unidadeId === unidade.id)
    .sort((a, b) => a.prioridade - b.prioridade);

  function textoStatusUnidade(status?: string) {
    if (status === "ativa") return "🟢 Ativa";
    if (status === "desativada") return "🔴 Desativada";
    return "🟡 Pendente";
  }

  function nomeCompletoUnidade() {
    return unidade.bloco ? `${unidade.bloco} / ${unidade.nome}` : unidade.nome;
  }

  function textoPerfil(perfil?: string) {
    if (perfil === "familiar") return "Familiar";
    if (perfil === "inquilino") return "Inquilino";
    if (perfil === "proprietario") return "Proprietário";
    if (perfil === "funcionario") return "Funcionário";
    if (perfil === "outro") return "Outro";
    return "Morador";
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-3xl font-black text-blue-300">
              👥 Moradores
            </h3>

            <p className="text-slate-300 mt-1 font-bold">
              {nomeCompletoUnidade()}
            </p>

            <p className="text-sm text-slate-400 mt-1">
              {unidade.localNome} • {textoStatusUnidade(unidade.status)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-black"
          >
            ✕
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-bold">Unidade</p>
            <p className="text-xl font-black mt-1">{nomeCompletoUnidade()}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-bold">Moradores</p>
            <p className="text-xl font-black mt-1">
              {moradoresDaUnidade.length}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-bold">Status</p>
            <p className="text-xl font-black mt-1">
              {textoStatusUnidade(unidade.status)}
            </p>
          </div>
        </div>

        {unidade.possuiResponsavel && unidade.responsavelAdministrativo && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-5">
            <p className="text-xs text-blue-300 font-black mb-2">
              Responsável administrativo
            </p>

            <p className="text-lg font-black">
              {unidade.responsavelAdministrativo.nome}
            </p>

            {unidade.responsavelAdministrativo.telefone && (
              <p className="text-sm text-slate-400 mt-1">
                WhatsApp: {unidade.responsavelAdministrativo.telefone}
              </p>
            )}

            {unidade.responsavelAdministrativo.email && (
              <p className="text-sm text-slate-400">
                E-mail: {unidade.responsavelAdministrativo.email}
              </p>
            )}
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xl font-black text-white">
                Moradores da unidade
              </h4>
              <p className="text-sm text-slate-400">
                Cadastre, consulte e organize os moradores desta unidade.
              </p>
            </div>

            <button
              onClick={() => setAbrirNovoMorador(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-3 rounded-xl"
            >
              ➕ Adicionar morador
            </button>
          </div>

          {moradoresDaUnidade.length === 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-center">
              <p className="text-slate-300 font-bold">
                Nenhum morador cadastrado nesta unidade.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Quando os dados dos moradores chegarem, você poderá cadastrá-los
                aqui sem alterar a estrutura do condomínio.
              </p>
            </div>
          )}

          {moradoresDaUnidade.length > 0 && (
            <div className="space-y-3">
              {moradoresDaUnidade.map((morador) => (
                <div
                  key={morador.id}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">{morador.nome}</p>

                      <p className="text-sm text-slate-400">
                        📱 {morador.telefone}
                      </p>

                      {morador.email && (
                        <p className="text-sm text-slate-400">
                          ✉️ {morador.email}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-blue-300 font-bold">
                          Prioridade {morador.prioridade}
                        </span>

                        <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-bold">
                          {textoPerfil(morador.perfil)}
                        </span>

                        <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-green-300 font-bold">
                          {morador.status === "ativo" ? "🟢 Ativo" : "🔴 Inativo"}
                        </span>

                        {morador.recebeChamadas !== false && (
                          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-cyan-300 font-bold">
                            🔔 Recebe chamadas
                          </span>
                        )}

                        {morador.podeAbrirPortao && (
                          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-yellow-300 font-bold">
                            🚪 Abre portão
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-black px-3 py-2 rounded-xl">
                        ✏️ Editar
                      </button>

                      <button className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-black px-3 py-2 rounded-xl">
                        🚫 Desativar
                      </button>

                      <button className="bg-red-700 hover:bg-red-600 text-white text-xs font-black px-3 py-2 rounded-xl">
                        🗑 Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl mt-5"
        >
          Fechar
        </button>
      </div>

      {abrirNovoMorador && (
        <NovoMoradorModal
          unidade={unidade}
          onClose={() => setAbrirNovoMorador(false)}
        />
      )}
    </div>
  );
}
