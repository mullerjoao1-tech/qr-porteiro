"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getAuth,
} from "firebase/auth";

import {
  enviarRecuperacaoSenha,
} from "@/app/services/auth/auth";

type PermissoesPessoa = {
  receberChamadas?: boolean;
  abrirPortao?: boolean;
  visualizarCameras?: boolean;
  controlarAlarme?: boolean;
};

type PessoaFamilia = {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  perfilPrincipal?: string;
  permissoes?: PermissoesPessoa;
  ativo?: boolean;
};

type Props = {
  localId: string;
  localNome: string;
  onVoltar: () => void;
};

export default function FamiliaResidencia({
  localId,
  localNome,
  onVoltar,
}: Props) {
  const [
    pessoas,
    setPessoas,
  ] =
    useState<
      PessoaFamilia[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    modalAberto,
    setModalAberto,
  ] =
    useState(false);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    pessoaEditando,
    setPessoaEditando,
  ] = useState<PessoaFamilia | null>(
    null
  );

  const [
    salvandoEdicao,
    setSalvandoEdicao,
  ] = useState(false);

  const [
    permissaoReceberChamadas,
    setPermissaoReceberChamadas,
  ] = useState(false);

  const [
    permissaoAbrirPortao,
    setPermissaoAbrirPortao,
  ] = useState(false);

  const [
    permissaoVisualizarCameras,
    setPermissaoVisualizarCameras,
  ] = useState(false);

  const [
    permissaoControlarAlarme,
    setPermissaoControlarAlarme,
  ] = useState(false);

  const [
    nome,
    setNome,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    telefone,
    setTelefone,
  ] =
    useState("");

  const [
    cpf,
    setCpf,
  ] =
    useState("");

  const [
    receberChamadas,
    setReceberChamadas,
  ] =
    useState(true);

  const [
    abrirPortao,
    setAbrirPortao,
  ] =
    useState(false);

  const [
    visualizarCameras,
    setVisualizarCameras,
  ] =
    useState(false);

  const [
    controlarAlarme,
    setControlarAlarme,
  ] =
    useState(false);

  async function obterToken() {
    const usuario =
      getAuth()
        .currentUser;

    if (!usuario) {
      throw new Error(
        "Sess?o n?o encontrada."
      );
    }

    return usuario
      .getIdToken();
  }

  async function carregar() {
    try {
      setCarregando(
        true
      );

      const token =
        await obterToken();

      const resposta =
        await fetch(
          `/api/residencia/familia?localId=${encodeURIComponent(
            localId
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
        !dados.sucesso
      ) {
        throw new Error(
          dados.mensagem ||
          "Erro ao carregar fam\u00edlia."
        );
      }

      setPessoas(
        dados.pessoas ||
        []
      );
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "N\u00e3o foi poss\u00edvel carregar a fam\u00edlia."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  useEffect(() => {
    carregar();
  }, [localId]);

  function abrirEdicao(
    pessoa: PessoaFamilia
  ) {
    setPessoaEditando(
      pessoa
    );

    setPermissaoReceberChamadas(
      pessoa.permissoes?.receberChamadas === true
    );

    setPermissaoAbrirPortao(
      pessoa.permissoes?.abrirPortao === true
    );

    setPermissaoVisualizarCameras(
      pessoa.permissoes?.visualizarCameras === true
    );

    setPermissaoControlarAlarme(
      pessoa.permissoes?.controlarAlarme === true
    );
  }

  async function salvarEdicao() {
    if (
      !pessoaEditando ||
      salvandoEdicao
    ) {
      return;
    }

    try {
      setSalvandoEdicao(true);

      const token =
        await obterToken();

      const resposta =
        await fetch(
          "/api/residencia/familia",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                localId,

                uid:
                  pessoaEditando.uid,

                permissoes: {
                  receberChamadas:
                    permissaoReceberChamadas,

                  abrirPortao:
                    permissaoAbrirPortao,

                  visualizarCameras:
                    permissaoVisualizarCameras,

                  controlarAlarme:
                    permissaoControlarAlarme,
                },
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
          "Erro ao atualizar permissoes."
        );
      }

      setPessoaEditando(null);

      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Nao foi possivel atualizar as permissoes."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function removerPessoa(
    pessoa: PessoaFamilia
  ) {
    const confirmou =
      window.confirm(
        `Remover o acesso de ${pessoa.nome} a esta residencia?

A conta da pessoa no QR Core nao sera apagada.
Somente o vinculo com esta residencia sera removido.`
      );

    if (!confirmou) {
      return;
    }

    try {
      const token =
        await obterToken();

      const resposta =
        await fetch(
          `/api/residencia/familia?localId=${encodeURIComponent(
            localId
          )}&uid=${encodeURIComponent(
            pessoa.uid
          )}`,
          {
            method: "DELETE",

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
        !dados.sucesso
      ) {
        throw new Error(
          dados.mensagem ||
          "Erro ao remover acesso."
        );
      }

      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Nao foi possivel remover o acesso."
      );
    }
  }

  function limparFormulario() {
    setNome("");
    setEmail("");
    setTelefone("");
    setCpf("");

    setReceberChamadas(
      true
    );

    setAbrirPortao(
      false
    );

    setVisualizarCameras(
      false
    );

    setControlarAlarme(
      false
    );
  }

  async function salvarPessoa() {
    try {
      setSalvando(
        true
      );

      const token =
        await obterToken();

      const resposta =
        await fetch(
          "/api/residencia/familia",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                localId,
                nome,
                email,
                telefone,
                cpf,

                permissoes: {
                  receberChamadas,
                  abrirPortao,
                  visualizarCameras,
                  controlarAlarme,
                },
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
          "Erro ao cadastrar pessoa."
        );
      }

      let mensagemFinal =
        dados.mensagem;

      if (
        dados.statusConvite ===
        "pendente"
      ) {
        const resultadoEmail =
          await enviarRecuperacaoSenha(
            email
          );

        if (
          resultadoEmail.sucesso
        ) {
          mensagemFinal =
            "Pessoa cadastrada com sucesso. O e-mail para definir a senha foi enviado.";
        } else {
          mensagemFinal =
            "Pessoa cadastrada com sucesso, mas o e-mail para definir a senha n?o p?de ser enviado. " +
            (resultadoEmail.erro ||
              "");
        }
      } else {
        mensagemFinal =
          "Pessoa existente reutilizada e vinculada \u00e0 resid\u00eancia. Ela poder\u00e1 acessar com a senha que j\u00e1 possui.";
      }

      alert(
        mensagemFinal
      );

      setModalAberto(
        false
      );

      limparFormulario();

      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "N?o foi poss?vel cadastrar a pessoa."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  return (
    <div className="space-y-5">

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Família / Moradores
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              {localNome}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Cadastre quem mora na residência e escolha exatamente o que cada pessoa pode acessar.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                onVoltar
              }
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-black text-slate-200 hover:bg-slate-700"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={() =>
                setModalAberto(
                  true
                )
              }
              className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400"
            >
              + Adicionar pessoa
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
        {carregando ? (
          <p className="text-slate-400">
            Carregando fam&iacute;lia...
          </p>
        ) : pessoas.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
            <p className="font-black text-white">
              Nenhuma pessoa cadastrada
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Adicione familiares ou moradores desta residência.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {pessoas.map(
              (
                pessoa
              ) => (
                <article
                  key={
                    pessoa.uid
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {
                          pessoa.nome
                        }
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {
                          pessoa.email
                        }
                      </p>

                      {pessoa.telefone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {
                            pessoa.telefone
                          }
                        </p>
                      )}
                    </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-black text-green-300">
                    Ativo
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      abrirEdicao(pessoa)
                    }
                    title="Editar permissoes"
                    className="flex h-9 min-w-[72px] items-center justify-center rounded-xl border border-cyan-400 bg-cyan-500 px-3 text-xs font-black text-slate-950 shadow-sm transition hover:bg-cyan-400 active:scale-95"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removerPessoa(pessoa)
                    }
                    title="Remover acesso"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400 bg-red-600 text-lg text-white shadow-sm transition hover:bg-red-500 active:scale-95"
                  >
                    &#128465;
                  </button>
                </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {pessoa
                      .permissoes
                      ?.receberChamadas && (
                      <span className="rounded-xl bg-blue-950 px-3 py-2 text-xs font-bold text-blue-300">
                        Recebe chamadas
                      </span>
                    )}

                    {pessoa
                      .permissoes
                      ?.abrirPortao && (
                      <span className="rounded-xl bg-violet-950 px-3 py-2 text-xs font-bold text-violet-300">
                        Abre portão
                      </span>
                    )}

                    {pessoa
                      .permissoes
                      ?.visualizarCameras && (
                      <span className="rounded-xl bg-cyan-950 px-3 py-2 text-xs font-bold text-cyan-300">
                        Vê câmeras
                      </span>
                    )}

                    {pessoa
                      .permissoes
                      ?.controlarAlarme && (
                      <span className="rounded-xl bg-emerald-950 px-3 py-2 text-xs font-bold text-emerald-300">
                        Controla alarme
                      </span>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {pessoaEditando && (
        <div
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={() => {
            if (!salvandoEdicao) {
              setPessoaEditando(null);
            }
          }}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl md:p-6"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                  Editar acesso
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  {pessoaEditando.nome}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {pessoaEditando.email}
                </p>
              </div>

              <button
                type="button"
                disabled={salvandoEdicao}
                onClick={() =>
                  setPessoaEditando(null)
                }
                className="rounded-xl bg-slate-800 px-4 py-2 font-black text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {[
                {
                  titulo: "Receber chamadas",
                  valor:
                    permissaoReceberChamadas,
                  alterar:
                    setPermissaoReceberChamadas,
                },
                {
                  titulo: "Abrir portao",
                  valor:
                    permissaoAbrirPortao,
                  alterar:
                    setPermissaoAbrirPortao,
                },
                {
                  titulo: "Visualizar cameras",
                  valor:
                    permissaoVisualizarCameras,
                  alterar:
                    setPermissaoVisualizarCameras,
                },
                {
                  titulo: "Controlar alarme",
                  valor:
                    permissaoControlarAlarme,
                  alterar:
                    setPermissaoControlarAlarme,
                },
              ].map((item) => (
                <label
                  key={item.titulo}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-4"
                >
                  <span className="font-bold text-white">
                    {item.titulo}
                  </span>

                  <input
                    type="checkbox"
                    checked={item.valor}
                    onChange={(evento) =>
                      item.alterar(
                        evento.target.checked
                      )
                    }
                    className="h-5 w-5 accent-cyan-500"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={salvarEdicao}
              disabled={salvandoEdicao}
              className="mt-6 w-full rounded-2xl bg-cyan-500 px-5 py-4 font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {salvandoEdicao
                ? "Salvando..."
                : "Salvar permissoes"}
            </button>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  Nova pessoa
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Família / Moradores
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalAberto(
                    false
                  )
                }
                disabled={
                  salvando
                }
                className="rounded-xl bg-slate-800 px-4 py-2 font-black text-white"
              >
                X
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <input
                value={
                  nome
                }
                onChange={(
                  evento
                ) =>
                  setNome(
                    evento.target.value
                  )
                }
                placeholder="Nome completo"
                className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-cyan-500"
              />

              <input
                value={
                  email
                }
                onChange={(
                  evento
                ) =>
                  setEmail(
                    evento.target.value
                  )
                }
                placeholder="E-mail"
                type="email"
                className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-cyan-500"
              />

              <input
                value={
                  telefone
                }
                onChange={(
                  evento
                ) =>
                  setTelefone(
                    evento.target.value
                  )
                }
                placeholder="Telefone"
                className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-cyan-500"
              />

              <input
                value={
                  cpf
                }
                onChange={(
                  evento
                ) =>
                  setCpf(
                    evento.target.value
                  )
                }
                placeholder="CPF"
                className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Acessos permitidos
              </p>

              <div className="mt-3 grid gap-2">
                {[
                  {
                    titulo:
                      "Receber chamadas",
                    valor:
                      receberChamadas,
                    alterar:
                      setReceberChamadas,
                  },

                  {
                    titulo:
                      "Abrir portão",
                    valor:
                      abrirPortao,
                    alterar:
                      setAbrirPortao,
                  },

                  {
                    titulo:
                      "Visualizar câmeras",
                    valor:
                      visualizarCameras,
                    alterar:
                      setVisualizarCameras,
                  },

                  {
                    titulo:
                      "Controlar alarme",
                    valor:
                      controlarAlarme,
                    alterar:
                      setControlarAlarme,
                  },
                ].map(
                  (
                    item
                  ) => (
                    <label
                      key={
                        item.titulo
                      }
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 p-4"
                    >
                      <span className="font-bold text-white">
                        {
                          item.titulo
                        }
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          item.valor
                        }
                        onChange={(
                          evento
                        ) =>
                          item.alterar(
                            evento.target.checked
                          )
                        }
                        className="h-5 w-5"
                      />
                    </label>
                  )
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={
                salvarPessoa
              }
              disabled={
                salvando
              }
              className="mt-5 w-full rounded-2xl bg-cyan-500 px-5 py-4 font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : "Cadastrar e preparar convite"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
