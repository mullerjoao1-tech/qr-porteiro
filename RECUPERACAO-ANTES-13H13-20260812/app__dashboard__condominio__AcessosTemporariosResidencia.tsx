"use client";

import { useEffect, useState } from "react";

import {
  getAuth,
} from "firebase/auth";

type PermissoesTemporarias = {
  abrirPortao: boolean;
  receberChamadas: boolean;
};

type AcessoTemporario = {
  id: string;
  nome: string;
  telefone?: string;
  tipo?: string;
  inicio?: number;
  fim?: number;
  pin?: string;
  status?: string;
  arquivado?: boolean;
  arquivadoEm?: number;
  arquivadoPor?: string;
  permissoes?: PermissoesTemporarias;
};

type Props = {
  localId: string;
  localNome: string;
  onVoltar: () => void;
};

function formatarData(valor?: number) {
  if (!valor) return "-";

  return new Date(valor).toLocaleString("pt-BR");
}

export default function AcessosTemporariosResidencia({
  localId,
  localNome,
  onVoltar,
}: Props) {
  const [acessos, setAcessos] = useState<AcessoTemporario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [
    abrindoPortaoAcessoId,
    setAbrindoPortaoAcessoId,
  ] = useState("");

  const [
    mensagemPortao,
    setMensagemPortao,
  ] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [
    historicoAberto,
    setHistoricoAberto,
  ] =
    useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("visitante");

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const [abrirPortao, setAbrirPortao] = useState(true);
  const [receberChamadas, setReceberChamadas] = useState(false);

  async function obterToken() {
    const usuario =
      getAuth().currentUser;

    if (!usuario) {
      throw new Error(
        "Sess?o n?o encontrada."
      );
    }

    return usuario.getIdToken();
  }

  async function carregar() {
    if (!localId) {
      setAcessos([]);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);

      const token =
        await obterToken();

      const resposta = await fetch(
        `/api/residencia/acessos-temporarios?localId=${encodeURIComponent(
          localId
        )}`,
        {
          cache: "no-store",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.mensagem || "Não foi possível carregar os acessos temporários."
        );
      }

      setAcessos(
        Array.isArray(dados.acessos)
          ? dados.acessos
          : []
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar acessos temporários:",
        erro
      );

      setAcessos([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [localId]);

  function limparFormulario() {
    setNome("");
    setTelefone("");
    setTipo("visitante");
    setInicio("");
    setFim("");
    setAbrirPortao(true);
    setReceberChamadas(false);
  }

  async function cadastrar() {
    if (!nome.trim()) {
      alert("Informe o nome da pessoa.");
      return;
    }

    if (!inicio) {
      alert("Informe quando o acesso começa.");
      return;
    }

    if (!fim) {
      alert("Informe quando o acesso termina.");
      return;
    }

    const inicioData = new Date(inicio);
    const fimData = new Date(fim);

    if (
      Number.isNaN(inicioData.getTime()) ||
      Number.isNaN(fimData.getTime())
    ) {
      alert("Informe datas válidas.");
      return;
    }

    if (fimData.getTime() <= inicioData.getTime()) {
      alert(
        "O término do acesso precisa ser depois do início."
      );
      return;
    }

    try {
      setSalvando(true);

      const token =
        await obterToken();

      const resposta = await fetch(
        "/api/residencia/acessos-temporarios",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            localId,
            nome: nome.trim(),
            telefone: telefone.trim(),
            tipo,

            inicio: inicioData.getTime(),
            fim: fimData.getTime(),

            permissoes: {
              abrirPortao,
              receberChamadas,
            },
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.mensagem ||
            "Não foi possível criar o acesso temporário."
        );
      }

      let mensagem =
        dados.mensagem ||
        "Acesso temporário criado com sucesso.";

      if (dados.acesso?.pin) {
        mensagem +=
          `\n\nSenha temporária: ${dados.acesso?.pin}`;
      }

      alert(mensagem);

      setModalAberto(false);
      limparFormulario();

      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível criar o acesso."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function abrirPortaoDoAcesso(
    acesso: AcessoTemporario
  ) {
    if (abrindoPortaoAcessoId) {
      return;
    }

    try {
      setAbrindoPortaoAcessoId(
        acesso.id
      );

      setMensagemPortao(
        "Abrindo portao..."
      );

      const token =
        await obterToken();

      const resposta =
        await fetch(
          `/api/abrir-portao?localId=${encodeURIComponent(
            localId
          )}&acessoId=${encodeURIComponent(
            acesso.id
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        dados.success !== true
      ) {
        throw new Error(
          dados.erro ||
          dados.mensagem ||
          "Nao foi possivel abrir o portao."
        );
      }

      setMensagemPortao(
        `Portao aberto para ${acesso.nome}.`
      );

      setTimeout(() => {
        setMensagemPortao("");
      }, 5000);

    } catch (erro) {

      setMensagemPortao("");

      alert(
        erro instanceof Error
          ? erro.message
          : "Nao foi possivel abrir o portao."
      );

    } finally {
      setAbrindoPortaoAcessoId("");
    }
  }

  async function arquivar(
    acesso: AcessoTemporario
  ) {
    const confirmar =
      window.confirm(
        `Retirar ${acesso.nome} da tela principal?\n\nO registro continuara salvo no Historico.`
      );

    if (!confirmar) {
      return;
    }

    try {
      const token =
        await obterToken();

      const resposta =
        await fetch(
          "/api/residencia/acessos-temporarios",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                localId,

                acessoId:
                  acesso.id,

                acao:
                  "arquivar",
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados.sucesso
      ) {
        throw new Error(
          dados.mensagem ||
            "Nao foi possivel arquivar o acesso."
        );
      }

      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Nao foi possivel arquivar o acesso."
      );
    }
  }

  async function revogar(acesso: AcessoTemporario) {
    const confirmar = window.confirm(
      `Revogar o acesso temporário de ${acesso.nome}?`
    );

    if (!confirmar) return;

    try {
      const token =
        await obterToken();

      const resposta = await fetch(
        `/api/residencia/acessos-temporarios?localId=${encodeURIComponent(
          localId
        )}&acessoId=${encodeURIComponent(
          acesso.id
        )}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.mensagem ||
            "Não foi possível revogar o acesso."
        );
      }

      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível revogar o acesso."
      );
    }
  }

  const acessosAtivosTela =
    acessos.filter(
      (acesso) =>
        acesso.arquivado !== true &&
        acesso.status !== "expirado" &&
        acesso.status !== "revogado"
    );

  const acessosHistorico =
    acessos.filter(
      (acesso) =>
        acesso.arquivado === true ||
        acesso.status === "expirado" ||
        acesso.status === "revogado"
    );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              Acessos temporários
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              {localNome}
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Crie acessos com prazo definido para visitantes,
              familiares, prestadores e outras pessoas.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onVoltar}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-black text-slate-200 hover:bg-slate-700"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={() =>
                setHistoricoAberto(
                  (atual) =>
                    !atual
                )
              }
              className={[
                "rounded-2xl border px-4 py-3 text-sm font-black transition",
                historicoAberto
                  ? "border-cyan-400 bg-cyan-500 text-slate-950"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
              ].join(" ")}
            >
              Historico
            </button>

            <button
              type="button"
              onClick={() => setModalAberto(true)}
              className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              + Novo acesso
            </button>
          </div>
        </div>
      </section>

      {mensagemPortao && (
        <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 px-4 py-3 text-sm font-black text-emerald-300">
          {mensagemPortao}
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
        {carregando ? (
          <p className="text-slate-400">
            Carregando acessos...
          </p>
        ) : (
          historicoAberto
            ? acessosHistorico
            : acessosAtivosTela
        ).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
            <div className="text-4xl">
              🔑
            </div>

            <p className="mt-3 font-black text-white">
              Nenhum acesso temporário
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Quando você criar uma autorização temporária,
              ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {(historicoAberto
              ? acessosHistorico
              : acessosAtivosTela
            ).map((acesso) => (
              <article
                key={acesso.id}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-amber-400">
                      {acesso.tipo || "Visitante"}
                    </p>

                    <h3 className="mt-1 text-lg font-black text-white">
                      {acesso.nome}
                    </h3>

                    {acesso.telefone && (
                      <p className="mt-1 text-sm text-slate-400">
                        {acesso.telefone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-black text-amber-300">
                      {acesso.arquivado
                        ? "arquivado"
                        : acesso.status || "Ativo"}
                    </span>

                    {!historicoAberto && (
                      <button
                        type="button"
                        onClick={() =>
                          arquivar(
                            acesso
                          )
                        }
                        title="Retirar da tela e manter no Historico"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400 bg-red-600 text-lg text-white transition hover:bg-red-500 active:scale-95"
                      >
                        &#128465;
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-900 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Validade
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-200">
                    De: {formatarData(acesso.inicio)}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-200">
                    Até: {formatarData(acesso.fim)}
                  </p>
                </div>

                {acesso.pin && (
                  <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-xs font-black uppercase text-amber-300">
                      Senha temporária
                    </p>

                    <p className="mt-1 text-2xl font-black tracking-[0.25em] text-white">
                      {acesso.pin}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {acesso.permissoes?.abrirPortao && (
                    acesso.status === "ativo" &&
                    !historicoAberto ? (
                      <button
                        type="button"
                        onClick={() =>
                          abrirPortaoDoAcesso(
                            acesso
                          )
                        }
                        disabled={
                          abrindoPortaoAcessoId ===
                          acesso.id
                        }
                        className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white transition hover:bg-violet-500 active:scale-95 disabled:opacity-60"
                      >
                        {abrindoPortaoAcessoId ===
                        acesso.id
                          ? "Abrindo..."
                          : "Abrir port?o"}
                      </button>
                    ) : (
                      <span className="rounded-xl bg-violet-950 px-3 py-2 text-xs font-bold text-violet-300">
                        Port?o autorizado
                      </span>
                    )
                  )}

                  {acesso.permissoes?.receberChamadas && (
                    <span className="rounded-xl bg-blue-950 px-3 py-2 text-xs font-bold text-blue-300">
                      Recebe chamadas
                    </span>
                  )}
                </div>

                {!historicoAberto &&
                  acesso.status !== "revogado" &&
                  acesso.status !== "expirado" && (
                    <button
                      type="button"
                      onClick={() =>
                        revogar(
                          acesso
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-red-800 bg-red-950/40 px-4 py-2 text-sm font-black text-red-300 hover:bg-red-950"
                    >
                      Revogar acesso
                    </button>
                  )}
              </article>
            ))}
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={() => {
            if (!salvando) {
              setModalAberto(false);
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                  Novo acesso
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Acesso temporário
                </h2>
              </div>

              <button
                type="button"
                disabled={salvando}
                onClick={() => setModalAberto(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 font-black text-white"
              >
                X
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={nome}
                onChange={(evento) =>
                  setNome(evento.target.value)
                }
                placeholder="Nome da pessoa"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-white outline-none focus:border-amber-400"
              />

              <input
                value={telefone}
                onChange={(evento) =>
                  setTelefone(evento.target.value)
                }
                placeholder="Telefone"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-white outline-none focus:border-amber-400"
              />

              <select
                value={tipo}
                onChange={(evento) =>
                  setTipo(evento.target.value)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-white outline-none"
              >
                <option value="visitante">
                  Visitante
                </option>

                <option value="familiar">
                  Familiar
                </option>

                <option value="prestador">
                  Prestador de serviço
                </option>

                <option value="hospede">
                  Hóspede
                </option>

                <option value="outro">
                  Outro
                </option>
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <span className="text-xs font-black uppercase text-slate-400">
                    Início
                  </span>

                  <input
                    type="datetime-local"
                    value={inicio}
                    onChange={(evento) =>
                      setInicio(evento.target.value)
                    }
                    className="mt-2 w-full bg-transparent text-white outline-none"
                  />
                </label>

                <label className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <span className="text-xs font-black uppercase text-slate-400">
                    Término
                  </span>

                  <input
                    type="datetime-local"
                    value={fim}
                    onChange={(evento) =>
                      setFim(evento.target.value)
                    }
                    className="mt-2 w-full bg-transparent text-white outline-none"
                  />
                </label>
              </div>

              <div className="pt-2">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  Permissões
                </p>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <span className="font-bold text-white">
                    Abrir portão
                  </span>

                  <input
                    type="checkbox"
                    checked={abrirPortao}
                    onChange={(evento) =>
                      setAbrirPortao(
                        evento.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />
                </label>

                <label className="mt-2 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <span className="font-bold text-white">
                    Receber chamadas
                  </span>

                  <input
                    type="checkbox"
                    checked={receberChamadas}
                    onChange={(evento) =>
                      setReceberChamadas(
                        evento.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={cadastrar}
              disabled={salvando}
              className="mt-5 w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60"
            >
              {salvando
                ? "Criando acesso..."
                : "Criar acesso temporário"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}