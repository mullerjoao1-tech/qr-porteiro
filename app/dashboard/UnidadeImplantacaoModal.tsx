"use client";

import { useState } from "react";
import { get, ref, update } from "firebase/database";

import { db } from "../services/firebase";

type ImplantacaoUnidade = {
  status?: string;
  protocolo?: string;
  enviadoEm?: string;
  iniciadoEm?: string;
  atualizadoEm?: string;
  aprovadoEm?: string;
  implantadoEm?: string;
  quantidadeMoradores?: number;
  ultimaSolicitacaoId?: string;
  aprovadoPor?: string;
};

type UnidadeImplantacao = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipoLocal?: string;
  bloco?: string;
  nome: string;
  tipo?: string;
  modoChamado?: string;
  status?: string;
  criadoEm?: string;
  implantacao?: ImplantacaoUnidade;
  statusImplantacao?: string;
};

type MoradorImplantacao = {
  id: string;
  codigo?: string;
  nome: string;
  telefone?: string;
  email?: string;
  unidadeId: string;
  unidadeNome?: string;
  prioridade?: number;
  perfil?: string;
  recebeChamadas?: boolean;
  podeAbrirPortao?: boolean;
  status?: string;
  criadoEm?: string;
  atualizadoEm?: string;
};

type AtualizacaoImplantacao = {
  id: string;
  codigo: string;

  condominioId: string;
  condominioNome: string;
  condominioSlug?: string;

  unidadeId: string;
  unidadeCodigo?: string;
  unidadeNome: string;
  bloco?: string;
  nomeUnidade?: string;

  nome: string;
  telefone: string;
  email?: string;
  perfil: string;
  recebeChamadas: boolean;

  status: string;
  origem?: string;
  criadoEm: string;
  atualizadoEm?: string;
};

type Props = {
  unidade: UnidadeImplantacao;
  moradores: MoradorImplantacao[];
  pendencia?: AtualizacaoImplantacao | null;
  onClose: () => void;
  onVisualizarPendencia?: (pendencia: AtualizacaoImplantacao) => void;
};

function textoStatusImplantacao(status?: string) {
  const statusConhecidos: Record<string, string> = {
    "sem-cadastro": "⚪ Sem cadastro",
    "link-enviado": "🔵 Link enviado",
    "cadastro-iniciado": "🟡 Cadastro iniciado",
    "aguardando-analise": "🟠 Aguardando análise",
    "correcao-solicitada": "🟣 Correção solicitada",
    aprovado: "🟢 Aprovado",
    implantado: "✅ Implantado",
  };

  return statusConhecidos[status || ""] || "⚪ Sem cadastro";
}

function classesStatusImplantacao(status?: string) {
  if (status === "implantado") {
    return "border-green-700 bg-green-950/40 text-green-300";
  }

  if (status === "aprovado") {
    return "border-emerald-700 bg-emerald-950/40 text-emerald-300";
  }

  if (status === "aguardando-analise") {
    return "border-orange-700 bg-orange-950/40 text-orange-300";
  }

  if (status === "cadastro-iniciado") {
    return "border-yellow-700 bg-yellow-950/40 text-yellow-300";
  }

  if (status === "link-enviado") {
    return "border-blue-700 bg-blue-950/40 text-blue-300";
  }

  if (status === "correcao-solicitada") {
    return "border-purple-700 bg-purple-950/40 text-purple-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function textoPerfil(perfil?: string) {
  const perfis: Record<string, string> = {
    proprietario: "Proprietário",
    inquilino: "Inquilino",
    familiar: "Familiar",
    morador: "Morador",
    funcionario: "Funcionário",
    outro: "Outro",
  };

  return perfis[perfil || ""] || perfil || "Morador";
}

function formatarData(data?: string) {
  if (!data) {
    return "Ainda não registrado";
  }

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return data;
  }

  return valor.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UnidadeImplantacaoModal({
  unidade,
  moradores,
  pendencia,
  onClose,
  onVisualizarPendencia,
}: Props) {
  const [limpando, setLimpando] = useState(false);
  const [excluindoUnidade, setExcluindoUnidade] = useState(false);

  const moradoresDaUnidade = moradores
    .filter((morador) => morador.unidadeId === unidade.id)
    .sort(
      (a, b) =>
        Number(a.prioridade || 1) - Number(b.prioridade || 1)
    );

  const statusImplantacao =
    unidade.statusImplantacao ||
    unidade.implantacao?.status ||
    (moradoresDaUnidade.length > 0
      ? "implantado"
      : pendencia
        ? "aguardando-analise"
        : "sem-cadastro");

  const nomeCompletoUnidade = unidade.bloco
    ? `${unidade.bloco} / ${unidade.nome}`
    : unidade.nome;

  async function limparImplantacaoTeste() {
    if (limpando) return;

    const confirmar = window.confirm(
      [
        "ATENÇÃO: limpar implantação em modo teste?",
        "",
        `Unidade: ${nomeCompletoUnidade}`,
        `Local: ${unidade.localNome}`,
        "",
        "Esta ação vai excluir:",
        "• todos os moradores vinculados a esta unidade;",
        "• todas as atualizações cadastrais desta unidade;",
        "• protocolo e linha do tempo da implantação;",
        "",
        "A unidade voltará para Sem cadastro.",
        "",
        "Esta ação não pode ser desfeita.",
      ].join("\n")
    );

    if (!confirmar) return;

    const confirmarNovamente = window.confirm(
      `Confirma a exclusão definitiva dos dados de teste da unidade ${nomeCompletoUnidade}?`
    );

    if (!confirmarNovamente) return;

    setLimpando(true);

    try {
      const atualizacoesSnapshot = await get(
        ref(db, "qrCentral/atualizacoesCadastrais")
      );

      const atualizacoesDados = atualizacoesSnapshot.val();
      const alteracoes: Record<string, unknown> = {};

      moradoresDaUnidade.forEach((morador) => {
        alteracoes[`qrCentral/moradores/${morador.id}`] = null;
      });

      if (atualizacoesDados) {
        Object.entries(atualizacoesDados).forEach(
          ([id, valor]) => {
            const atualizacao = valor as {
              unidadeId?: string;
            };

            if (atualizacao.unidadeId === unidade.id) {
              alteracoes[
                `qrCentral/atualizacoesCadastrais/${id}`
              ] = null;
            }
          }
        );
      }

      alteracoes[
        `qrCentral/unidades/${unidade.id}/implantacao`
      ] = {
        status: "sem-cadastro",
        atualizadoEm: new Date().toISOString(),
        quantidadeMoradores: 0,
      };

      await update(ref(db), alteracoes);

      alert(
        `Implantação da unidade ${nomeCompletoUnidade} limpa com sucesso.`
      );

      onClose();
    } catch (erro) {
      console.error("Erro ao limpar implantação:", erro);

      alert(
        "Não foi possível limpar a implantação. Verifique o terminal antes de tentar novamente."
      );
    } finally {
      setLimpando(false);
    }
  }


  async function excluirUnidadeTeste() {
    if (excluindoUnidade || limpando) return;

    const confirmar = window.confirm(
      [
        "ATENÇÃO: excluir esta unidade de teste por completo?",
        "",
        `Unidade: ${nomeCompletoUnidade}`,
        `Local: ${unidade.localNome}`,
        "",
        "Esta ação vai excluir:",
        "• todos os moradores vinculados;",
        "• todas as atualizações cadastrais;",
        "• toda a implantação;",
        "• a própria unidade;",
        "",
        "Esta ação não pode ser desfeita.",
      ].join("\n")
    );

    if (!confirmar) return;

    const codigoDigitado = window.prompt(
      `Para confirmar, digite exatamente o código da unidade:\n\n${unidade.codigo}`
    );

    if (codigoDigitado !== unidade.codigo) {
      alert("Código diferente. A exclusão foi cancelada.");
      return;
    }

    setExcluindoUnidade(true);

    try {
      const atualizacoesSnapshot = await get(
        ref(db, "qrCentral/atualizacoesCadastrais")
      );

      const atualizacoesDados = atualizacoesSnapshot.val();
      const alteracoes: Record<string, unknown> = {};

      moradoresDaUnidade.forEach((morador) => {
        alteracoes[`qrCentral/moradores/${morador.id}`] = null;
      });

      if (atualizacoesDados) {
        Object.entries(atualizacoesDados).forEach(([id, valor]) => {
          const atualizacao = valor as {
            unidadeId?: string;
          };

          if (atualizacao.unidadeId === unidade.id) {
            alteracoes[
              `qrCentral/atualizacoesCadastrais/${id}`
            ] = null;
          }
        });
      }

      alteracoes[`qrCentral/unidades/${unidade.id}`] = null;

      await update(ref(db), alteracoes);

      alert(
        `A unidade ${nomeCompletoUnidade} e todos os dados de teste foram excluídos.`
      );

      onClose();
    } catch (erro) {
      console.error("Erro ao excluir unidade de teste:", erro);

      alert(
        "Não foi possível excluir a unidade. Verifique o terminal antes de tentar novamente."
      );
    } finally {
      setExcluindoUnidade(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-wider text-blue-300">
              IMPLANTAÇÃO DA UNIDADE
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              🏠 {nomeCompletoUnidade}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {unidade.localNome} • {unidade.codigo}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={limpando || excluindoUnidade}
            className="rounded-xl bg-slate-800 px-4 py-2 font-black text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div
          className={`mt-6 rounded-2xl border p-4 ${classesStatusImplantacao(
            statusImplantacao
          )}`}
        >
          <p className="text-xs font-black opacity-80">
            STATUS DA IMPLANTAÇÃO
          </p>

          <p className="mt-1 text-2xl font-black">
            {textoStatusImplantacao(statusImplantacao)}
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-blue-300">
                  MORADORES
                </p>

                <h3 className="mt-1 text-xl font-black text-white">
                  👥 Moradores vinculados
                </h3>
              </div>

              <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-sm font-black text-slate-300">
                {moradoresDaUnidade.length}
              </span>
            </div>

            {moradoresDaUnidade.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
                <p className="font-bold text-slate-300">
                  Nenhum morador vinculado
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  O morador aparecerá aqui depois da aprovação.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {moradoresDaUnidade.map((morador) => (
                  <div
                    key={morador.id}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-black text-white">
                          👤 {morador.nome}
                        </p>

                        {morador.telefone && (
                          <p className="mt-1 text-sm text-slate-400">
                            📱 {morador.telefone}
                          </p>
                        )}

                        {morador.email && (
                          <p className="text-sm text-slate-400">
                            ✉️ {morador.email}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
                          {textoPerfil(morador.perfil)}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-black text-blue-300">
                          Prioridade {morador.prioridade || 1}
                        </span>

                        {morador.recebeChamadas !== false && (
                          <span className="rounded-full border border-cyan-800 bg-cyan-950/40 px-3 py-1 text-xs font-black text-cyan-300">
                            🔔 Recebe chamadas
                          </span>
                        )}

                        {morador.podeAbrirPortao && (
                          <span className="rounded-full border border-yellow-800 bg-yellow-950/40 px-3 py-1 text-xs font-black text-yellow-300">
                            🚪 Abre portão
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-xs font-black text-blue-300">
              LINHA DO TEMPO
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              📋 Implantação
            </h3>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs font-black text-slate-500">
                  LINK ENVIADO
                </p>
                <p className="mt-1 font-bold text-slate-300">
                  {formatarData(unidade.implantacao?.enviadoEm)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs font-black text-slate-500">
                  CADASTRO INICIADO
                </p>
                <p className="mt-1 font-bold text-slate-300">
                  {formatarData(unidade.implantacao?.iniciadoEm)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs font-black text-slate-500">
                  APROVADO
                </p>
                <p className="mt-1 font-bold text-slate-300">
                  {formatarData(unidade.implantacao?.aprovadoEm)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs font-black text-slate-500">
                  IMPLANTADO
                </p>
                <p className="mt-1 font-bold text-slate-300">
                  {formatarData(unidade.implantacao?.implantadoEm)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-black text-slate-500">
                ÚLTIMO PROTOCOLO
              </p>

              <p className="mt-1 break-all text-lg font-black text-blue-300">
                {unidade.implantacao?.protocolo ||
                  pendencia?.codigo ||
                  "Nenhum protocolo"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black text-slate-500">
                ÚLTIMA ATUALIZAÇÃO
              </p>

              <p className="mt-1 text-lg font-black text-slate-300">
                {formatarData(unidade.implantacao?.atualizadoEm)}
              </p>
            </div>
          </div>
        </section>

        {pendencia && (
          <div className="mt-5 rounded-2xl border border-orange-800 bg-orange-950/30 p-4">
            <p className="font-black text-orange-300">
              🟠 Existe uma atualização aguardando análise
            </p>

            <p className="mt-2 text-sm text-orange-100">
              {pendencia.nome} • {pendencia.telefone}
            </p>

            {onVisualizarPendencia && (
              <button
                type="button"
                onClick={() => onVisualizarPendencia(pendencia)}
                className="mt-4 w-full rounded-xl bg-orange-600 py-3 font-black text-white hover:bg-orange-500"
              >
                Visualizar pendência
              </button>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              alert(
                "A edição da unidade será conectada em uma próxima etapa."
              )
            }
            className="rounded-xl bg-blue-600 py-3 font-black text-white hover:bg-blue-500"
          >
            ✏️ Editar unidade
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "O cadastro manual de morador será conectado em uma próxima etapa."
              )
            }
            className="rounded-xl bg-green-600 py-3 font-black text-white hover:bg-green-500"
          >
            ➕ Adicionar morador
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "O histórico completo será conectado em uma próxima etapa."
              )
            }
            className="rounded-xl bg-purple-600 py-3 font-black text-white hover:bg-purple-500"
          >
            📋 Histórico
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/20 p-4">
          <p className="font-black text-red-300">
            🧪 Ferramentas de teste
          </p>

          <p className="mt-2 text-sm leading-relaxed text-red-100/80">
            Use somente para remover dados fictícios antes da implantação real.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={limparImplantacaoTeste}
              disabled={limpando || excluindoUnidade}
              className="w-full rounded-xl bg-orange-700 py-3 font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {limpando
                ? "Limpando implantação..."
                : "🧹 Limpar implantação"}
            </button>

            <button
              type="button"
              onClick={excluirUnidadeTeste}
              disabled={limpando || excluindoUnidade}
              className="w-full rounded-xl bg-red-700 py-3 font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {excluindoUnidade
                ? "Excluindo unidade..."
                : "🗑️ Excluir unidade de teste"}
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-red-200/70">
            Limpar implantação mantém a unidade. Excluir unidade remove a unidade
            inteira e todos os dados vinculados.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={limpando || excluindoUnidade}
          className="mt-4 w-full rounded-xl bg-slate-700 py-3 font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
