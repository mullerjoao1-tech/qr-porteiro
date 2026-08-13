"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onValue,
  ref,
  remove,
} from "firebase/database";

import {
  db,
} from "../../../services/firebase";

import NovoVinculoModal from "./NovoVinculoModal";

type PerfilUsuario = {
  [perfil: string]:
    boolean | undefined;
};

type VinculoUsuario = {
  localId?:
    string;

  localNome?:
    string;

  localSlug?:
    string;

  tipoLocal?:
    string;

  perfilPrincipal?:
    string;

  perfis?:
    PerfilUsuario;

  unidades?:
    Record<
      string,
      boolean
    >;

  ativo?:
    boolean;
};

type PessoaUniversal = {
  id:
    string;

  uid?:
    string;

  nome?:
    string;

  email?:
    string;

  telefone?:
    string;

  cpf?:
    string;

  status?:
    string;

  fotoUrl?:
    string;

  primeiroAcesso?:
    boolean;

  precisaTrocarSenha?:
    boolean;

  criadoEm?:
    number | string;

  atualizadoEm?:
    number | string;

  ultimoLogin?:
    number | string;

  locais?:
    Record<
      string,
      VinculoUsuario
    >;

  condominios?:
    Record<
      string,
      VinculoUsuario
    >;
};

function somenteNumeros(
  valor:
    string
): string {
  return valor.replace(
    /\D/g,
    ""
  );
}

function formatarCpf(
  valor?:
    string
): string {
  if (!valor) {
    return "CPF não informado";
  }

  const numeros =
    somenteNumeros(
      valor
    ).slice(
      0,
      11
    );

  if (
    numeros.length !==
    11
  ) {
    return valor;
  }

  return numeros.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4"
  );
}

function formatarTelefone(
  valor?:
    string
): string {
  if (!valor) {
    return "Telefone não informado";
  }

  const numeros =
    somenteNumeros(
      valor
    );

  if (
    numeros.length ===
    11
  ) {
    return numeros.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (
    numeros.length ===
    10
  ) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return valor;
}

function formatarData(
  valor?:
    number | string
): string {
  if (!valor) {
    return "Não informado";
  }

  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return String(
      valor
    );
  }

  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

function nomePerfil(
  perfil:
    string
): string {
  const nomes:
    Record<
      string,
      string
    > = {
      morador:
        "Morador",

      sindico:
        "Síndico",

      administradora:
        "Administradora",

      gestor_local:
        "Gestor local",

      porteiro:
        "Porteiro",

      central:
        "Central",

      funcionario:
        "Funcionário",

      financeiro:
        "Financeiro",

      prestador:
        "Prestador",

      conselheiro:
        "Conselheiro",

      administrador_master:
        "Administrador master",

      proprietario:
        "Proprietário",

      inquilino:
        "Inquilino",

      responsavel:
        "Responsável",

      gerente:
        "Gerente",

      outro:
        "Outro",
    };

  return (
    nomes[
      perfil
    ] ||
    perfil
      .replace(
        /_/g,
        " "
      )
      .replace(
        /\b\w/g,
        (
          letra
        ) =>
          letra.toUpperCase()
      )
  );
}

function obterVinculosOficiais(
  pessoa:
    PessoaUniversal
): Array<
  {
    id:
      string;

    dados:
      VinculoUsuario;
  }
> {
  const locais =
    pessoa.locais ||
    {};

  if (
    Object.keys(
      locais
    ).length >
    0
  ) {
    return Object.entries(
      locais
    ).map(
      (
        [
          id,
          dados,
        ]
      ) => ({
        id,
        dados,
      })
    );
  }

  return Object.entries(
    pessoa.condominios ||
      {}
  ).map(
    (
      [
        id,
        dados,
      ]
    ) => ({
      id,
      dados,
    })
  );
}

function obterPerfisPessoa(
  pessoa:
    PessoaUniversal
): string[] {
  const perfis =
    new Set<string>();

  obterVinculosOficiais(
    pessoa
  ).forEach(
    (
      vinculo
    ) => {
      const principal =
        vinculo.dados
          .perfilPrincipal;

      if (
        principal
      ) {
        perfis.add(
          principal
        );
      }

      Object.entries(
        vinculo.dados
          .perfis ||
          {}
      ).forEach(
        (
          [
            perfil,
            ativo,
          ]
        ) => {
          if (
            ativo
          ) {
            perfis.add(
              perfil
            );
          }
        }
      );
    }
  );

  return Array.from(
    perfis
  );
}

type Props = {
  filtroLocalId?: string | null;

  onLimparFiltroLocal:
    () => void;
};

export default function PainelPessoas({
  filtroLocalId,
  onLimparFiltroLocal,
}: Props) {
  const [
    pessoas,
    setPessoas,
  ] = useState<
    PessoaUniversal[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(
    true
  );

  const [
    busca,
    setBusca,
  ] = useState(
    ""
  );

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState(
    "todos"
  );

  const [
    pessoaSelecionada,
    setPessoaSelecionada,
  ] = useState<
    PessoaUniversal | null
  >(
    null
  );

  const [
    excluindoPessoaId,
    setExcluindoPessoaId,
  ] = useState<
    string | null
  >(
    null
  );


  const [
    modalNovaPessoaAberto,
    setModalNovaPessoaAberto,
  ] = useState(false);

  const [
    nomeNovaPessoa,
    setNomeNovaPessoa,
  ] = useState("");

  const [
    emailNovaPessoa,
    setEmailNovaPessoa,
  ] = useState("");

  const [
    cpfNovaPessoa,
    setCpfNovaPessoa,
  ] = useState("");

  const [
    telefoneNovaPessoa,
    setTelefoneNovaPessoa,
  ] = useState("");

  const [
    salvandoNovaPessoa,
    setSalvandoNovaPessoa,
  ] = useState(false);

  const [
    modalNovoVinculoAberto,
    setModalNovoVinculoAberto,
  ] = useState(false);

  useEffect(
    () => {
      const referencia =
        ref(
          db,
          "usuarios-v2"
        );

      const desligar =
        onValue(
          referencia,
          (
            snapshot
          ) => {
            const dados =
              snapshot.val() as
                Record<
                  string,
                  Omit<
                    PessoaUniversal,
                    "id"
                  >
                > | null;

            if (
              !dados
            ) {
              setPessoas(
                []
              );

              setCarregando(
                false
              );

              return;
            }

            const lista =
              Object.entries(
                dados
              )
                .map(
                  (
                    [
                      id,
                      valor,
                    ]
                  ) => ({
                    id,
                    ...valor,
                  })
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    String(
                      a.nome ||
                      a.email ||
                      ""
                    ).localeCompare(
                      String(
                        b.nome ||
                        b.email ||
                        ""
                      ),
                      "pt-BR"
                    )
                );

            setPessoas(
              lista
            );

            setCarregando(
              false
            );
          },
          (
            erro
          ) => {
            console.error(
              "Erro ao carregar usuarios-v2:",
              erro
            );

            setPessoas(
              []
            );

            setCarregando(
              false
            );
          }
        );

      return () =>
        desligar();
    },
    []
  );

  const pessoasFiltradas =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLowerCase();

        return pessoas.filter(
          (
            pessoa
          ) => {
            const vinculos =
              obterVinculosOficiais(
                pessoa
              );

            const perfis =
              obterPerfisPessoa(
                pessoa
              );

            const passaBusca =
              !termo ||
              [
                pessoa.nome,
                pessoa.email,
                pessoa.telefone,
                pessoa.cpf,
                pessoa.uid,
                pessoa.id,
                ...perfis,
                ...vinculos.flatMap(
                  (
                    vinculo
                  ) => [
                    vinculo.id,
                    vinculo.dados
                      .localId,
                    vinculo.dados
                      .localNome,
                    vinculo.dados
                      .localSlug,
                    vinculo.dados
                      .tipoLocal,
                  ]
                ),
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase()
                .includes(
                  termo
                );

            const status =
              pessoa.status ||
              "ativo";

            const passaStatus =
              filtroStatus ===
                "todos" ||
              status ===
                filtroStatus;

        const passaLocal =
          !filtroLocalId ||
          vinculos.some(
            (vinculo) =>
              vinculo.id === filtroLocalId ||
              vinculo.dados.localId === filtroLocalId ||
              vinculo.dados.localSlug === filtroLocalId
          );

        return (
          passaBusca &&
          passaStatus &&
          passaLocal
        );
          }
        );
      },
      [
        busca,
        filtroStatus,
        filtroLocalId,
pessoas,
      ]
    );

  const nomeLocalFiltrado =
  useMemo(
    () => {
      if (!filtroLocalId) {
        return "";
      }

      for (
        const pessoa of pessoas
      ) {
        const vinculos =
          obterVinculosOficiais(
            pessoa
          );

        const vinculo =
          vinculos.find(
            (item) =>
              item.id ===
                filtroLocalId ||
              item.dados.localId ===
                filtroLocalId ||
              item.dados.localSlug ===
                filtroLocalId
          );

        if (vinculo) {
          return (
            vinculo.dados.localNome ||
            filtroLocalId
          );
        }
      }

      return filtroLocalId;
    },
    [
      filtroLocalId,
      pessoas,
    ]
  );

const totalAtivos =
    pessoas.filter(
      (
        pessoa
      ) =>
        pessoa.status !==
          "inativo" &&
        pessoa.status !==
          "bloqueado"
    ).length;

  const totalComCpf =
    pessoas.filter(
      (
        pessoa
      ) =>
        somenteNumeros(
          pessoa.cpf ||
          ""
        ).length ===
        11
    ).length;

  const totalComMultiplosLocais =
    pessoas.filter(
      (
        pessoa
      ) =>
        obterVinculosOficiais(
          pessoa
        ).length >
        1
    ).length;

  async function excluirPessoa(
    pessoa: PessoaUniversal
  ) {
    if (
      excluindoPessoaId
    ) {
      return;
    }

    const vinculos =
      obterVinculosOficiais(
        pessoa
      );

    if (
      vinculos.length > 0
    ) {
      alert(
        `Esta pessoa ainda possui ${vinculos.length} vínculo(s).

Remova primeiro os vínculos na aba Vínculos e depois exclua a pessoa.`
      );

      return;
    }

    const confirmado =
      window.confirm(
        `Excluir definitivamente "${pessoa.nome || pessoa.email || pessoa.id}" da base de Pessoas?

Este cadastro possui 0 vínculos.

A exclusão removerá a pessoa de usuarios-v2.`
      );

    if (
      !confirmado
    ) {
      return;
    }

    try {
      setExcluindoPessoaId(
        pessoa.id
      );

      await remove(
        ref(
          db,
          `usuarios-v2/${pessoa.id}`
        )
      );

      if (
        pessoaSelecionada?.id ===
        pessoa.id
      ) {
        setPessoaSelecionada(
          null
        );
      }
    } catch (
      erro
    ) {
      console.error(
        "Erro ao excluir pessoa:",
        erro
      );

      alert(
        "Não foi possível excluir a pessoa."
      );
    } finally {
      setExcluindoPessoaId(
        null
      );
    }
  }
  async function cadastrarNovaPessoa() {
    if (salvandoNovaPessoa) {
      return;
    }

    const nome =
      nomeNovaPessoa.trim();

    const email =
      emailNovaPessoa
        .trim()
        .toLowerCase();

    const cpf =
      somenteNumeros(
        cpfNovaPessoa
      );

    const telefone =
      telefoneNovaPessoa.trim();

    if (!nome) {
      alert(
        "Informe o nome da pessoa."
      );

      return;
    }

    if (!email) {
      alert(
        "Informe o e-mail da pessoa."
      );

      return;
    }

    try {
      setSalvandoNovaPessoa(
        true
      );

      const resposta =
        await fetch(
          "/api/cadastro-universal/pessoas",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nome,
              email,
              cpf,
              telefone,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.sucesso
      ) {
        throw new Error(
          dados?.erro ||
          "Nao foi possivel cadastrar a pessoa."
        );
      }

      setModalNovaPessoaAberto(
        false
      );

      setNomeNovaPessoa("");
      setEmailNovaPessoa("");
      setCpfNovaPessoa("");
      setTelefoneNovaPessoa("");

      if (dados.reutilizado) {
        const origem =
          dados.encontradoPor === "email"
            ? "e-mail"
            : dados.encontradoPor === "cpf"
              ? "CPF"
              : "cadastro existente";

        alert(
          "Pessoa ja existente no QR Core. Cadastro reutilizado por " +
          origem +
          "."
        );
      } else {
        alert(
          "Pessoa cadastrada com sucesso no QR Core."
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao cadastrar pessoa:",
        erro
      );

      alert(
        erro instanceof Error
          ? erro.message
          : "Nao foi possivel cadastrar a pessoa."
      );
    } finally {
      setSalvandoNovaPessoa(
        false
      );
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-blue-800 bg-gradient-to-r from-blue-950/70 to-slate-900 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-blue-300">
              👤 CADASTRO DE PESSOAS
            </p>

            <h3 className="mt-2 text-2xl font-black text-white md:text-3xl">
              Base única do QR Core
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Cada pessoa possui uma única identidade e pode ter vínculos, perfis e permissões em vários locais.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalNovaPessoaAberto(true)
            }
            className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500 active:scale-95"
          >
            + Nova pessoa
          </button>
        </div>
      </section>

      
      {modalNovaPessoaAberto && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl md:p-6">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                  CADASTRO UNIVERSAL
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Nova pessoa
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  O QR Core verificará se essa identidade já existe antes de criar um novo cadastro.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalNovaPessoaAberto(false)
                }
                className="rounded-xl bg-slate-800 px-4 py-2 font-black text-white hover:bg-slate-700"
              >
                X
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Nome completo
                </label>

                <input
                  value={nomeNovaPessoa}
                  onChange={(evento) =>
                    setNomeNovaPessoa(
                      evento.target.value
                    )
                  }
                  placeholder="Nome completo"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  E-mail
                </label>

                <input
                  type="email"
                  value={emailNovaPessoa}
                  onChange={(evento) =>
                    setEmailNovaPessoa(
                      evento.target.value
                    )
                  }
                  placeholder="email@exemplo.com"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    CPF
                  </label>

                  <input
                    value={cpfNovaPessoa}
                    onChange={(evento) =>
                      setCpfNovaPessoa(
                        evento.target.value
                      )
                    }
                    placeholder="CPF"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Telefone / WhatsApp
                  </label>

                  <input
                    value={telefoneNovaPessoa}
                    onChange={(evento) =>
                      setTelefoneNovaPessoa(
                        evento.target.value
                      )
                    }
                    placeholder="(41) 99999-9999"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              <div className="rounded-2xl border border-blue-900 bg-blue-950/30 p-4">
                <p className="font-black text-blue-200">
                  Identidade única no QR Core
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Se a pessoa já existir, o cadastro existente será reutilizado em vez de criar uma duplicidade.
                </p>
              </div>

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setModalNovaPessoaAberto(false)
                  }
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-black text-white hover:bg-slate-700"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={salvandoNovaPessoa}
                  onClick={cadastrarNovaPessoa}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoNovaPessoa
                    ? "Salvando..."
                    : "Cadastrar pessoa"}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

<section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-400">
            TOTAL
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {
              pessoas.length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-green-800 bg-green-950/25 p-4">
          <p className="text-xs font-bold text-green-300">
            ATIVOS
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {
              totalAtivos
            }
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-800 bg-cyan-950/25 p-4">
          <p className="text-xs font-bold text-cyan-300">
            COM CPF
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {
              totalComCpf
            }
          </p>
        </div>

        <div className="rounded-2xl border border-violet-800 bg-violet-950/25 p-4">
          <p className="text-xs font-bold text-violet-300">
            MÚLTIPLOS LOCAIS
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {
              totalComMultiplosLocais
            }
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        {filtroLocalId && (
          <div className="col-span-full flex flex-col gap-3 rounded-xl border border-blue-700 bg-blue-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-400">
                LOCAL SELECIONADO
              </p>

              <p className="mt-1 font-black text-white">
                {nomeLocalFiltrado}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onLimparFiltroLocal
              }
              className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-500"
            >
              Todos os locais
            </button>
          </div>
        )}

          <input
            value={
              busca
            }
            onChange={(
              evento
            ) =>
              setBusca(
                evento.target.value
              )
            }
            placeholder="Pesquisar por nome, CPF, e-mail, telefone, perfil ou local..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />

          <select
            value={
              filtroStatus
            }
            onChange={(
              evento
            ) =>
              setFiltroStatus(
                evento.target.value
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
          >
            <option value="todos">
              Todos os status
            </option>

            <option value="ativo">
              🟢 Ativos
            </option>

            <option value="pendente">
              🟡 Pendentes
            </option>

            <option value="inativo">
              ⚪ Inativos
            </option>

            <option value="bloqueado">
              🔴 Bloqueados
            </option>
          </select>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          {
            pessoasFiltradas.length
          } pessoa
          {
            pessoasFiltradas.length ===
            1
              ? ""
              : "s"
          } encontrada
          {
            pessoasFiltradas.length ===
            1
              ? ""
              : "s"
          }.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <p className="text-xs font-black text-blue-300">
          PESSOAS CADASTRADAS
        </p>

        <h3 className="mt-1 text-2xl font-black text-white">
          Ecossistema QR
        </h3>

        {carregando ? (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <p className="font-black text-slate-300">
              Carregando pessoas...
            </p>
          </div>
        ) : pessoasFiltradas.length ===
          0 ? (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <div className="text-4xl">
              👤
            </div>

            <p className="mt-3 font-black text-slate-300">
              Nenhuma pessoa encontrada
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Ajuste a pesquisa ou cadastre uma nova pessoa.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pessoasFiltradas.map(
              (
                pessoa
              ) => {
                const vinculos =
                  obterVinculosOficiais(
                    pessoa
                  );

                const perfis =
                  obterPerfisPessoa(
                    pessoa
                  );

                const ativo =
                  pessoa.status !==
                    "inativo" &&
                  pessoa.status !==
                    "bloqueado";

                return (
                  <article
                    key={
                      pessoa.id
                    }
                    className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 transition hover:border-blue-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
                        👤
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${
                            ativo
                              ? "bg-green-950 text-green-300"
                              : "bg-red-950 text-red-300"
                          }`}
                        >
                          {ativo
                            ? "🟢 ATIVO"
                            : "🔴 INATIVO"}
                        </span>

                        <button
                          type="button"
                          title="Excluir pessoa"
                          onClick={() =>
                            void excluirPessoa(
                              pessoa
                            )
                          }
                          disabled={
                            excluindoPessoaId ===
                            pessoa.id
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-900 bg-red-950/30 text-sm transition hover:bg-red-900 disabled:opacity-40"
                        >
                          {excluindoPessoaId ===
                          pessoa.id
                            ? "…"
                            : "🗑"}
                        </button>
                      </div>
                    </div>

                    <h4 className="mt-4 text-xl font-black text-white">
                      {
                        pessoa.nome ||
                        "Nome não informado"
                      }
                    </h4>

                    <p className="mt-2 break-all text-sm text-slate-400">
                      ✉️{" "}
                      {
                        pessoa.email ||
                        "E-mail não informado"
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      🪪{" "}
                      {
                        formatarCpf(
                          pessoa.cpf
                        )
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      📱{" "}
                      {
                        formatarTelefone(
                          pessoa.telefone
                        )
                      }
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {perfis.length >
                      0 ? (
                        perfis.map(
                          (
                            perfil
                          ) => (
                            <span
                              key={
                                perfil
                              }
                              className="rounded-full border border-blue-800 bg-blue-950/30 px-3 py-1 text-[10px] font-black text-blue-300"
                            >
                              {
                                nomePerfil(
                                  perfil
                                )
                              }
                            </span>
                          )
                        )
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-black text-slate-400">
                          Perfil não informado
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <p className="text-[10px] font-black text-slate-500">
                        VÍNCULOS
                      </p>

                      <p className="mt-1 font-black text-white">
                        {
                          vinculos.length
                        } local
                        {
                          vinculos.length ===
                          1
                            ? ""
                            : "is"
                        }
                      </p>

                      {vinculos.length >
                        0 && (
                        <div className="mt-2 space-y-1">
                          {vinculos
                            .slice(
                              0,
                              3
                            )
                            .map(
                              (
                                vinculo
                              ) => (
                                <p
                                  key={
                                    vinculo.id
                                  }
                                  className="truncate text-xs text-slate-400"
                                >
                                  🏢{" "}
                                  {
                                    vinculo
                                      .dados
                                      .localNome ||
                                    vinculo.id
                                  }
                                </p>
                              )
                            )}

                          {vinculos.length >
                            3 && (
                            <p className="text-xs font-bold text-blue-300">
                              +{" "}
                              {
                                vinculos.length -
                                3
                              } outro(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPessoaSelecionada(
                          pessoa
                        )
                      }
                      className="mt-auto pt-5"
                    >
                      <span className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-blue-500 active:scale-95">
                        Abrir perfil
                      </span>
                    </button>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {pessoaSelecionada && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-blue-300">
                  👤 PERFIL UNIVERSAL
                </p>

                <h3 className="mt-2 text-2xl font-black text-white">
                  {
                    pessoaSelecionada.nome ||
                    "Pessoa"
                  }
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPessoaSelecionada(
                    null
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl font-black text-white hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-[10px] font-black text-slate-500">
                  CPF
                </p>

                <p className="mt-1 font-bold text-white">
                  {
                    formatarCpf(
                      pessoaSelecionada.cpf
                    )
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-[10px] font-black text-slate-500">
                  STATUS
                </p>

                <p className="mt-1 font-bold text-white">
                  {
                    pessoaSelecionada.status ||
                    "ativo"
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:col-span-2">
                <p className="text-[10px] font-black text-slate-500">
                  E-MAIL
                </p>

                <p className="mt-1 break-all font-bold text-white">
                  {
                    pessoaSelecionada.email ||
                    "Não informado"
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-[10px] font-black text-slate-500">
                  TELEFONE
                </p>

                <p className="mt-1 font-bold text-white">
                  {
                    formatarTelefone(
                      pessoaSelecionada.telefone
                    )
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-[10px] font-black text-slate-500">
                  ÚLTIMO LOGIN
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  {
                    formatarData(
                      pessoaSelecionada.ultimoLogin
                    )
                  }
                </p>
              </div>
            </div>

            <section className="mt-5 rounded-2xl border border-blue-800 bg-blue-950/20 p-4">
              <p className="text-xs font-black text-blue-300">
                LOCAIS VINCULADOS
              </p>

              <div className="mt-3 space-y-2">
                {obterVinculosOficiais(
                  pessoaSelecionada
                ).length ===
                0 ? (
                  <p className="text-sm text-slate-400">
                    Nenhum local vinculado.
                  </p>
                ) : (
                  obterVinculosOficiais(
                    pessoaSelecionada
                  ).map(
                    (
                      vinculo
                    ) => (
                      <div
                        key={
                          vinculo.id
                        }
                        className="rounded-xl border border-slate-700 bg-slate-800 p-3"
                      >
                        <p className="font-black text-white">
                          🏢{" "}
                          {
                            vinculo
                              .dados
                              .localNome ||
                            vinculo.id
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Perfil:{" "}
                          {
                            nomePerfil(
                              vinculo
                                .dados
                                .perfilPrincipal ||
                              "não informado"
                            )
                          }
                        </p>

                    {vinculo.dados.unidades &&
                      Object.keys(
                        vinculo.dados.unidades
                      ).filter(
                        (unidadeId) =>
                          vinculo.dados.unidades?.[
                            unidadeId
                          ] === true
                      ).length > 0 && (
                        <div className="mt-2 rounded-lg bg-slate-900/70 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Unidade
                          </p>

                          {Object.keys(
                            vinculo.dados.unidades
                          )
                            .filter(
                              (unidadeId) =>
                                vinculo.dados.unidades?.[
                                  unidadeId
                                ] === true
                            )
                            .map(
                              (unidadeId) => {
                                const nomeUnidade =
                                  unidadeId
                                    .replace(
                                      vinculo.id + "-",
                                      ""
                                    )
                                    .replace(
                                      /-/g,
                                      " "
                                    )
                                    .replace(
                                      /bloco/gi,
                                      "Bloco"
                                    )
                                    .replace(
                                      / ap /gi,
                                      " - Apartamento "
                                    );

                                return (
                                  <p
                                    key={unidadeId}
                                    className="mt-1 text-xs font-bold text-cyan-300"
                                  >
                                    {nomeUnidade}
                                  </p>
                                );
                              }
                            )}
                        </div>
                      )}
                      </div>
                    )
                  )
                )}
              </div>
            </section>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() =>
                  setModalNovoVinculoAberto(
                    true
                  )
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500 active:scale-[0.99]"
              >
                + Adicionar vínculo
              </button>

              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-400">
                O vínculo será adicionado a esta mesma identidade universal, sem criar outra pessoa.
              </div>

              <NovoVinculoModal
                aberto={
                  modalNovoVinculoAberto
                }
                pessoaInicialId={
                  pessoaSelecionada.id
                }
                onClose={() =>
                  setModalNovoVinculoAberto(
                    false
                  )
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




