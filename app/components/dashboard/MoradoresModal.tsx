"use client";

import { useState } from "react";
import { ref, remove, update } from "firebase/database";
import { db } from "../../services/firebase";
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
  atualizadoEm?: string;
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
  const [editandoMorador, setEditandoMorador] =
    useState<MoradorCadastrado | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [excluindoMorador, setExcluindoMorador] = useState(false);

  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPrioridade, setEditPrioridade] = useState("1");
  const [editPerfil, setEditPerfil] = useState("morador");
  const [editStatus, setEditStatus] = useState("ativo");
  const [editRecebeChamadas, setEditRecebeChamadas] = useState(true);
  const [editPodeAbrirPortao, setEditPodeAbrirPortao] = useState(false);

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

  function formatarNome(texto: string) {
    return texto
      .trim()
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  }

  function abrirEdicaoMorador(morador: MoradorCadastrado) {
    setEditandoMorador(morador);
    setEditNome(morador.nome || "");
    setEditTelefone(morador.telefone || "");
    setEditEmail(morador.email || "");
    setEditPrioridade(String(morador.prioridade || 1));
    setEditPerfil(morador.perfil || "morador");
    setEditStatus(morador.status || "ativo");
    setEditRecebeChamadas(morador.recebeChamadas !== false);
    setEditPodeAbrirPortao(!!morador.podeAbrirPortao);
  }

  function fecharEdicaoMorador() {
    setEditandoMorador(null);
    setEditNome("");
    setEditTelefone("");
    setEditEmail("");
    setEditPrioridade("1");
    setEditPerfil("morador");
    setEditStatus("ativo");
    setEditRecebeChamadas(true);
    setEditPodeAbrirPortao(false);
  }

  async function salvarEdicaoMorador() {
    if (!editandoMorador) return;

    if (!editNome.trim()) {
      alert("Digite o nome do morador.");
      return;
    }

    if (!editTelefone.trim()) {
      alert("Digite o telefone/WhatsApp do morador.");
      return;
    }

    setSalvandoEdicao(true);

    try {
      await update(ref(db, `qrCentral/moradores/${editandoMorador.id}`), {
        nome: formatarNome(editNome),
        telefone: editTelefone.trim(),
        email: editEmail.trim(),
        prioridade: Number(editPrioridade),
        perfil: editPerfil,
        status: editStatus,
        recebeChamadas: editRecebeChamadas,
        podeAbrirPortao: editPodeAbrirPortao,
        atualizadoEm: new Date().toISOString(),
      });

      alert("Morador atualizado com sucesso.");
      fecharEdicaoMorador();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao atualizar morador.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function alternarStatusMorador(morador: MoradorCadastrado) {
    const novoStatus = morador.status === "ativo" ? "inativo" : "ativo";

    const confirmar = confirm(
      novoStatus === "inativo"
        ? `Desativar ${morador.nome}?`
        : `Reativar ${morador.nome}?`
    );

    if (!confirmar) return;

    setAlterandoStatus(true);

    try {
      await update(ref(db, `qrCentral/moradores/${morador.id}`), {
        status: novoStatus,
        atualizadoEm: new Date().toISOString(),
      });
    } catch (erro) {
      console.error(erro);
      alert("Erro ao alterar status do morador.");
    } finally {
      setAlterandoStatus(false);
    }
  }

  async function excluirMorador(morador: MoradorCadastrado) {
    const confirmar = confirm(
      `Excluir definitivamente ${morador.nome}?\n\nEsta ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    setExcluindoMorador(true);

    try {
      await remove(ref(db, `qrCentral/moradores/${morador.id}`));
      alert("Morador excluído com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao excluir morador.");
    } finally {
      setExcluindoMorador(false);
    }
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

        {unidade.possuiResponsavel &&
          unidade.responsavelAdministrativo && (
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

                        <span
                          className={`text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full font-bold ${
                            morador.status === "ativo"
                              ? "text-green-300"
                              : "text-red-300"
                          }`}
                        >
                          {morador.status === "ativo"
                            ? "🟢 Ativo"
                            : "🔴 Inativo"}
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

                    <div className="grid grid-cols-3 md:grid-cols-1 gap-2 min-w-[110px]">
                      <button
                        onClick={() => abrirEdicaoMorador(morador)}
                        className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-black px-3 py-2 rounded-xl"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => alternarStatusMorador(morador)}
                        disabled={alterandoStatus}
                        className={`disabled:bg-slate-700 text-white text-xs font-black px-3 py-2 rounded-xl ${
                          morador.status === "ativo"
                            ? "bg-orange-600 hover:bg-orange-500"
                            : "bg-green-600 hover:bg-green-500"
                        }`}
                      >
                        {morador.status === "ativo"
                          ? "🚫 Desativar"
                          : "🟢 Reativar"}
                      </button>

                      <button
                        onClick={() => excluirMorador(morador)}
                        disabled={excluindoMorador}
                        className="bg-red-700 hover:bg-red-600 disabled:bg-slate-700 text-white text-xs font-black px-3 py-2 rounded-xl"
                      >
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

      {editandoMorador && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">
                  ✏️ Editar morador
                </h2>

                <p className="text-slate-400 mt-2">
                  Unidade: {nomeCompletoUnidade()}
                </p>
              </div>

              <button
                onClick={fecharEdicaoMorador}
                className="bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2 text-white font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              />

              <input
                value={editTelefone}
                onChange={(e) => setEditTelefone(e.target.value)}
                placeholder="Telefone / WhatsApp"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              />

              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="E-mail (opcional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              />

              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={editPrioridade}
                  onChange={(e) => setEditPrioridade(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="1">Prioridade 1</option>
                  <option value="2">Prioridade 2</option>
                  <option value="3">Prioridade 3</option>
                  <option value="4">Prioridade 4</option>
                  <option value="5">Prioridade 5</option>
                </select>

                <select
                  value={editPerfil}
                  onChange={(e) => setEditPerfil(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="morador">Morador</option>
                  <option value="familiar">Familiar</option>
                  <option value="inquilino">Inquilino</option>
                  <option value="proprietario">Proprietário</option>
                  <option value="funcionario">Funcionário</option>
                  <option value="outro">Outro</option>
                </select>

                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <option value="ativo">🟢 Ativo</option>
                  <option value="inativo">🔴 Inativo</option>
                </select>
              </div>

              <label className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editRecebeChamadas}
                  onChange={(e) => setEditRecebeChamadas(e.target.checked)}
                  className="mt-1"
                />

                <div>
                  <p className="font-bold text-white">Recebe chamadas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Este morador será chamado quando o visitante selecionar esta unidade.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editPodeAbrirPortao}
                  onChange={(e) => setEditPodeAbrirPortao(e.target.checked)}
                  className="mt-1"
                />

                <div>
                  <p className="font-bold text-white">Pode abrir portão</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Permite que este morador use o botão de abertura quando a automação estiver ativa.
                  </p>
                </div>
              </label>

              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={fecharEdicaoMorador}
                  disabled={salvandoEdicao}
                  className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-black py-3 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarEdicaoMorador}
                  disabled={salvandoEdicao}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
                >
                  {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
