"use client";

import { useState } from "react";
import { ref, push, set, update } from "firebase/database";
import { db } from "../../services/firebase";

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
};

type Props = {
  unidade: UnidadeCadastrada;
  onClose: () => void;
};

export default function NovoMoradorModal({ unidade, onClose }: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [prioridade, setPrioridade] = useState("1");
  const [perfil, setPerfil] = useState("morador");
  const [status, setStatus] = useState("ativo");
  const [recebeChamadas, setRecebeChamadas] = useState(true);
  const [podeAbrirPortao, setPodeAbrirPortao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function nomeCompletoUnidade() {
    return unidade.bloco ? `${unidade.bloco} / ${unidade.nome}` : unidade.nome;
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

  async function salvarMorador() {
    if (!nome.trim()) {
      alert("Digite o nome do morador.");
      return;
    }

    if (!telefone.trim()) {
      alert("Digite o telefone/WhatsApp do morador.");
      return;
    }

    setSalvando(true);

    try {
      const moradoresRef = ref(db, "qrCentral/moradores");
      const novoMoradorRef = push(moradoresRef);
      const agora = new Date().toISOString();

      await set(novoMoradorRef, {
        codigo: `MOR-${Date.now()}`,
        nome: formatarNome(nome),
        telefone: telefone.trim(),
        email: email.trim(),
        unidadeId: unidade.id,
        unidadeNome: `${unidade.localNome} • ${nomeCompletoUnidade()}`,
        localId: unidade.localId,
        localNome: unidade.localNome,
        prioridade: Number(prioridade),
        perfil,
        status,
        recebeChamadas,
        podeAbrirPortao,
        criadoEm: agora,
      });

      if (unidade.status !== "ativa" && status === "ativo" && recebeChamadas) {
        const unidadeRef = ref(db, `qrCentral/unidades/${unidade.id}`);
        await update(unidadeRef, {
          status: "ativa",
          atualizadoEm: agora,
        });
      }

      alert("Morador cadastrado com sucesso.");
      onClose();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao cadastrar morador.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">
              ➕ Novo morador
            </h2>

            <p className="text-slate-400 mt-2">
              Cadastro para {nomeCompletoUnidade()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2 text-white font-black"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
          />

          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone / WhatsApp"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail (opcional)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
          />

          <div className="grid md:grid-cols-3 gap-3">
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="1">Prioridade 1</option>
              <option value="2">Prioridade 2</option>
              <option value="3">Prioridade 3</option>
              <option value="4">Prioridade 4</option>
              <option value="5">Prioridade 5</option>
            </select>

            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="ativo">🟢 Ativo</option>
              <option value="inativo">🔴 Inativo</option>
            </select>
          </div>

          <label className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={recebeChamadas}
              onChange={(e) => setRecebeChamadas(e.target.checked)}
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
              checked={podeAbrirPortao}
              onChange={(e) => setPodeAbrirPortao(e.target.checked)}
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
              onClick={onClose}
              disabled={salvando}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-black py-3 rounded-xl"
            >
              Cancelar
            </button>

            <button
              onClick={salvarMorador}
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
            >
              {salvando ? "Salvando..." : "Salvar morador"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
