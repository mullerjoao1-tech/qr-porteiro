"use client";

import { useState } from "react";
import {
  get,
  push,
  ref,
  set,
  update,
} from "firebase/database";

import { auth, db } from "../services/firebase";
import { atualizarStatusImplantacao } from "../services/implantacaoService";
type AtualizacaoCadastral = {
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
  atualizacao: AtualizacaoCadastral;
  onClose: () => void;

localIdOficial?: string;
localNomeOficial?: string;
unidadeIdOficial?: string;
unidadeNomeOficial?: string;
};

type MoradorExistente = {
  id: string;
  codigo?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  unidadeId?: string;
  unidadeNome?: string;
  prioridade?: number;
  perfil?: string;
  recebeChamadas?: boolean;
  podeAbrirPortao?: boolean;
  status?: string;
};

function textoPerfil(perfil?: string) {
  const perfis: Record<string, string> = {
    proprietario: "ProprietÃ¡rio",
    inquilino: "Inquilino",
    familiar: "Familiar",
    morador: "Morador",
    funcionario: "FuncionÃ¡rio",
    outro: "Outro",
  };

  return perfis[perfil || ""] || perfil || "NÃ£o informado";
}

function textoStatus(status?: string) {
  if (status === "aprovada") {
    return "ðŸŸ¢ Aprovada";
  }

  if (status === "recusada") {
    return "ðŸ”´ Recusada";
  }

  if (status === "correcao-solicitada") {
    return "ðŸ”µ CorreÃ§Ã£o solicitada";
  }

  return "ðŸŸ¡ Pendente";
}

function formatarData(data?: string) {
  if (!data) {
    return "Data nÃ£o informada";
  }

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return data;
  }

  return dataConvertida.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarNome(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(
      (palavra) =>
        palavra.charAt(0).toUpperCase() + palavra.slice(1)
    )
    .join(" ");
}

function somenteNumeros(valor?: string) {
  return (valor || "").replace(/\D/g, "");
}

export default function AtualizacaoPendenteModal({
  atualizacao,
  onClose,
  localIdOficial,
  localNomeOficial,
  unidadeIdOficial,
  unidadeNomeOficial,
}: Props) {
  const unidadeIdEfetivo =
  unidadeIdOficial ||
  atualizacao.unidadeId;

const localIdEfetivo =
  localIdOficial ||
  atualizacao.condominioId;

const localNomeEfetivo =
  localNomeOficial ||
  atualizacao.condominioNome;

const unidadeNomeEfetivo =
  unidadeNomeOficial ||
  atualizacao.unidadeNome;

const [aprovando, setAprovando] = useState(false);
const [editandoNome, setEditandoNome] = useState(false);
const [nomeEditado, setNomeEditado] =
  useState(atualizacao.nome || "");

  function acaoAindaNaoImplementada(acao: string) {
    alert(
      `${acao}\n\nEsta aÃ§Ã£o serÃ¡ conectada na prÃ³xima etapa.`
    );
  }

  async function salvarNomeCorrigido() {
  const nomeLimpo =
    formatarNome(
      nomeEditado
    );

  if (!nomeLimpo) {
    alert("Informe o nome.");
    return;
  }

  try {
    await update(
      ref(
        db,
        `qrCentral/atualizacoesCadastrais/${atualizacao.id}`
      ),
      {
        nome: nomeLimpo,
        atualizadoEm:
          new Date().toISOString(),
      }
    );

    setNomeEditado(
      nomeLimpo
    );

    setEditandoNome(
      false
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar nome corrigido:",
      erro
    );

    alert(
      "Nao foi possivel salvar o nome corrigido."
    );
  }
}

async function aprovarCadastro() {
    if (atualizacao.status !== "pendente") {
      alert("Esta solicitaÃ§Ã£o jÃ¡ foi analisada.");
      return;
    }

    const confirmar = confirm(
      [
        "Aprovar esta atualizaÃ§Ã£o cadastral?",
        "",
        `Morador: ${nomeEditado}`,
        `Unidade: ${atualizacao.unidadeNome}`,
        "",
        "O sistema criarÃ¡ o morador ou atualizarÃ¡ um cadastro existente com o mesmo telefone nesta unidade.",
      ].join("\n")
    );

    if (!confirmar) {
      return;
    }

    setAprovando(true);

    try {
      const solicitacaoRef = ref(
        db,
        `qrCentral/atualizacoesCadastrais/${atualizacao.id}`
      );

      const solicitacaoSnapshot = await get(solicitacaoRef);
      const solicitacaoAtual = solicitacaoSnapshot.val();

      if (!solicitacaoAtual) {
        alert("Esta solicitaÃ§Ã£o nÃ£o foi localizada.");
        onClose();
        return;
      }

      if (solicitacaoAtual.status !== "pendente") {
        alert("Esta solicitaÃ§Ã£o jÃ¡ foi analisada por outra pessoa.");
        onClose();
        return;
      }

      const administradorAtual = auth.currentUser;

      if (!administradorAtual) {
        throw new Error("Administrador nao autenticado.");
      }

      const tokenAdministrador =
        await administradorAtual.getIdToken();

      const respostaPreparacao = await fetch(
        "/api/usuarios/aprovar-atualizacao-cadastral",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenAdministrador}`,
          },
          body: JSON.stringify({
            atualizacaoId: atualizacao.id,
          }),
        }
      );

      const resultadoPreparacao =
        await respostaPreparacao.json();

      if (
        !respostaPreparacao.ok ||
        !resultadoPreparacao?.sucesso
      ) {
        throw new Error(
          resultadoPreparacao?.erro ||
            "Nao foi possivel preparar o acesso do morador."
        );
      }
      const moradoresRef = ref(db, "qrCentral/moradores");
      const moradoresSnapshot = await get(moradoresRef);
      const moradoresDados = moradoresSnapshot.val();

      const telefoneSolicitacao = somenteNumeros(
        atualizacao.telefone
      );

      let moradorExistente: MoradorExistente | null = null;

      if (moradoresDados) {
        const listaMoradores = Object.entries(moradoresDados).map(
          ([id, valor]) => ({
            id,
            ...(valor as Omit<MoradorExistente, "id">),
          })
        );

        moradorExistente =
          listaMoradores.find(
            (morador) =>
              morador.unidadeId === unidadeIdEfetivo &&
              somenteNumeros(morador.telefone) ===
                telefoneSolicitacao
          ) || null;
      }

      const agora = new Date().toISOString();
      let moradorId = "";
      let tipoAprovacao = "";

      if (moradorExistente) {
        moradorId = moradorExistente.id;
        tipoAprovacao = "morador-atualizado";

        await update(
          ref(db, `qrCentral/moradores/${moradorExistente.id}`),
          {
            nome: formatarNome(nomeEditado),
            telefone: atualizacao.telefone.trim(),
            email: atualizacao.email?.trim() || "",
            unidadeId: unidadeIdEfetivo,
            unidadeNome: `${atualizacao.condominioNome} â€¢ ${atualizacao.unidadeNome}`,
            localId: localIdEfetivo,
            localNome: localNomeEfetivo,
            prioridade: moradorExistente.prioridade || 1,
            perfil: atualizacao.perfil,
            status: "ativo",
            recebeChamadas: atualizacao.recebeChamadas,
            podeAbrirPortao:
              moradorExistente.podeAbrirPortao || false,
            atualizadoEm: agora,
          }
        );
      } else {
        const novoMoradorRef = push(moradoresRef);

        if (!novoMoradorRef.key) {
          throw new Error(
            "NÃ£o foi possÃ­vel gerar o identificador do morador."
          );
        }

        moradorId = novoMoradorRef.key;
        tipoAprovacao = "morador-criado";

        await set(novoMoradorRef, {
          codigo: `MOR-${Date.now()}`,
          nome: formatarNome(nomeEditado),
          telefone: atualizacao.telefone.trim(),
          email: atualizacao.email?.trim() || "",
          unidadeId: unidadeIdEfetivo,
          unidadeNome: `${atualizacao.condominioNome} â€¢ ${atualizacao.unidadeNome}`,
          localId: localIdEfetivo,
          localNome: localNomeEfetivo,
          prioridade: 1,
          perfil: atualizacao.perfil,
          status: "ativo",
          recebeChamadas: atualizacao.recebeChamadas,
          podeAbrirPortao: false,
          origemCadastro: "atualizacao-cadastral-aprovada",
          solicitacaoOrigemId: atualizacao.id,
          criadoEm: agora,
        });
      }

      await update(
        ref(db, `qrCentral/unidades/${atualizacao.unidadeId}`),
        {
          status: "ativa",
          atualizadoEm: agora,
        }
      );
const moradoresDaUnidadeSnapshot = await get(
  ref(db, "qrCentral/moradores")
);

const moradoresDaUnidadeDados =
  moradoresDaUnidadeSnapshot.val();

const quantidadeMoradores = moradoresDaUnidadeDados
  ? Object.values(moradoresDaUnidadeDados).filter(
      (morador: any) =>
        morador.unidadeId === unidadeIdEfetivo &&
        morador.status === "ativo"
    ).length
  : 0;

await atualizarStatusImplantacao(
  atualizacao.unidadeId,
  "implantado",
  {
    protocolo: atualizacao.codigo,
    aprovadoEm: agora,
    implantadoEm: agora,
    quantidadeMoradores,
    ultimaSolicitacaoId: atualizacao.id,
    aprovadoPor: "Admin Studio",
  }
);
      await update(solicitacaoRef, {
  nome: formatarNome(nomeEditado),
        status: "aprovada",
        aprovadoEm: agora,
        aprovadoPor: "Admin Studio",
        moradorId,
        resultadoAprovacao: tipoAprovacao,
        atualizadoEm: agora,
      });

      alert(
        tipoAprovacao === "morador-criado"
          ? "Cadastro aprovado e morador criado com sucesso."
          : "Cadastro aprovado e morador existente atualizado com sucesso."
      );

      onClose();
    } catch (erro) {
      console.error("Erro ao aprovar cadastro:", erro);

      alert(
        "NÃ£o foi possÃ­vel aprovar o cadastro. Nenhuma nova tentativa deve ser feita atÃ© verificar o erro no terminal."
      );
    } finally {
      setAprovando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-wider text-blue-300">
              ATUALIZAÃ‡ÃƒO CADASTRAL
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              ðŸ“‹ SolicitaÃ§Ã£o recebida
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Protocolo:{" "}
              <strong className="text-blue-300">
                {atualizacao.codigo}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={aprovando}
            className="rounded-xl bg-slate-800 px-4 py-2 font-black text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            âœ•
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-yellow-800 bg-yellow-950/50 px-3 py-1 text-xs font-black text-yellow-300">
            {textoStatus(atualizacao.status)}
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
            ðŸ¢ {atualizacao.condominioNome}
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
            ðŸ  {atualizacao.unidadeNome}
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
            {textoPerfil(atualizacao.perfil)}
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              CONDOMÃNIO
            </p>

            <p className="mt-1 text-lg font-black text-white">
              ðŸ¢ {atualizacao.condominioNome}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              UNIDADE
            </p>

            <p className="mt-1 text-lg font-black text-white">
              ðŸ  {atualizacao.unidadeNome}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              NOME ENVIADO
            </p>

            <p className="mt-1 text-lg font-black text-white">
              ðŸ‘¤ {nomeEditado}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-700 bg-blue-950/40 p-4">
            <p className="text-xs font-black text-blue-300">
              TELEFONE / WHATSAPP
            </p>

            <p className="mt-1 text-xl font-black text-white">
              ðŸ“± {atualizacao.telefone}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              E-MAIL
            </p>

            <p className="mt-1 break-all text-lg font-black text-white">
              âœ‰ï¸ {atualizacao.email || "NÃ£o informado"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              RELAÃ‡ÃƒO COM A UNIDADE
            </p>

            <p className="mt-1 text-lg font-black text-white">
              ðŸ  {textoPerfil(atualizacao.perfil)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              RECEBE CHAMADAS
            </p>

            <p className="mt-1 text-lg font-black text-white">
              {atualizacao.recebeChamadas
                ? "ðŸ”” Sim"
                : "ðŸ”• NÃ£o"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-black text-slate-500">
              ORIGEM
            </p>

            <p className="mt-1 text-lg font-black text-white">
              ðŸ”— AtualizaÃ§Ã£o cadastral
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs font-black text-slate-500">
            RECEBIDO EM
          </p>

          <p className="mt-1 text-lg font-black text-white">
            ðŸ•’ {formatarData(atualizacao.criadoEm)}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-yellow-800 bg-yellow-950/30 p-4">
          <p className="text-sm leading-relaxed text-yellow-100">
            Esta solicitaÃ§Ã£o ainda nÃ£o alterou o cadastro oficial.
            Confira todos os dados antes de aprovar.
          </p>
        </div>

        {editandoNome && (
          <div className="mt-5 rounded-2xl border border-blue-700 bg-blue-950/30 p-4">
            <p className="text-xs font-black text-blue-300">
              CORRIGIR NOME
            </p>

            <input
              value={nomeEditado}
              onChange={(event) =>
                setNomeEditado(event.target.value)
              }
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={salvarNomeCorrigido}
              className="mt-3 w-full rounded-xl bg-blue-600 py-3 font-black text-white hover:bg-blue-500"
            >
              Usar nome corrigido
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setEditandoNome(
                (valor) => !valor
              )
            }
            disabled={aprovando}
            className="rounded-xl bg-blue-600 py-3 font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            âœï¸ Editar antes de aprovar
          </button>

          <button
            type="button"
            onClick={() =>
              acaoAindaNaoImplementada("Solicitar correÃ§Ã£o")
            }
            disabled={aprovando}
            className="rounded-xl bg-cyan-600 py-3 font-black text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            ðŸ“ Solicitar correÃ§Ã£o
          </button>

          <button
            type="button"
            onClick={() =>
              acaoAindaNaoImplementada("Recusar solicitaÃ§Ã£o")
            }
            disabled={aprovando}
            className="rounded-xl bg-red-700 py-3 font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            âŒ Recusar
          </button>

          <button
            type="button"
            onClick={aprovarCadastro}
            disabled={aprovando}
            className="rounded-xl bg-green-600 py-3 font-black text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {aprovando
              ? "Aprovando cadastro..."
              : "âœ… Aprovar cadastro"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={aprovando}
          className="mt-4 w-full rounded-xl bg-slate-700 py-3 font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}


