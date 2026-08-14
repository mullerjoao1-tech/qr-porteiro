"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onValue,
  ref,
} from "firebase/database";

import {
  db,
} from "../../services/firebase";

import {
  atualizarPrioridadeResponsavel,
  atualizarStatusResponsavel,
  removerResponsavelVinculado,
  salvarResponsavelVinculado,
  type StatusResponsavelUnidade,
  type VinculoResponsavelUnidade,
} from "../../services/chamadas/VinculosResponsaveis";

type MoradorDaUnidade = {
  id:
    string;

  uid?:
    string;

  nome:
    string;

  email?:
    string;

  telefone?:
    string;

  unidadeId:
    string;

  status?:
    string;
};

type Props = {
  unidadeId:
    string;
};

function medalha(
  prioridade:
    number
): string {
  if (
    prioridade ===
    1
  ) {
    return "🥇";
  }

  if (
    prioridade ===
    2
  ) {
    return "🥈";
  }

  if (
    prioridade ===
    3
  ) {
    return "🥉";
  }

  return "🔢";
}

export default function ResponsaveisUnidade({
  unidadeId,
}: Props) {
  const [
    responsaveis,
    setResponsaveis,
  ] = useState<
    VinculoResponsavelUnidade[]
  >([]);

  const [
    moradoresDaUnidade,
    setMoradoresDaUnidade,
  ] = useState<
    MoradorDaUnidade[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(
    true
  );

  const [
    carregandoMoradores,
    setCarregandoMoradores,
  ] = useState(
    true
  );

  const [
    salvando,
    setSalvando,
  ] = useState(
    false
  );

  const [
    modalAberto,
    setModalAberto,
  ] = useState(
    false
  );

  const [
    editando,
    setEditando,
  ] = useState<
    VinculoResponsavelUnidade | null
  >(
    null
  );

  const [
    buscaMorador,
    setBuscaMorador,
  ] = useState(
    ""
  );

  const [
    moradorSelecionadoId,
    setMoradorSelecionadoId,
  ] = useState(
    ""
  );

  const [
    prioridade,
    setPrioridade,
  ] = useState(
    "1"
  );

  const [
    status,
    setStatus,
  ] = useState<
    StatusResponsavelUnidade
  >(
    "disponivel"
  );

  useEffect(
    () => {
      const referencia =
        ref(
          db,
          `unidades-v2/${unidadeId}/responsaveis`
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
                    VinculoResponsavelUnidade,
                    "id"
                  >
                > | null;

            if (
              !dados
            ) {
              setResponsaveis(
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
                .filter(
                  (
                    item
                  ) =>
                    item.ativo !==
                    false
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    Number(
                      a.prioridade ||
                      999
                    ) -
                    Number(
                      b.prioridade ||
                      999
                    )
                );

            setResponsaveis(
              lista
            );

            setCarregando(
              false
            );
          }
        );

      return () =>
        desligar();
    },
    [
      unidadeId,
    ]
  );

  /*
   * Agora a lista de inclusão mostra somente os moradores
   * já vinculados à unidade aberta.
   */
  /*
   * Lista de pessoas elegíveis para receber chamadas.
   *
   * Fonte principal:
   * usuarios-v2, respeitando o vínculo universal da pessoa com a unidade.
   *
   * Compatibilidade:
   * qrCentral/moradores continua sendo lido enquanto condomínios antigos
   * ainda dependerem dessa estrutura.
   */
  useEffect(
    () => {
      let moradoresLegados: MoradorDaUnidade[] = [];
      let moradoresUniversais: MoradorDaUnidade[] = [];

      function publicarLista() {
        const mapa =
          new Map<
            string,
            MoradorDaUnidade
          >();

        [
          ...moradoresLegados,
          ...moradoresUniversais,
        ].forEach(
          (morador) => {
            const identidade =
              morador.uid ||
              morador.id;

            mapa.set(
              identidade,
              morador
            );
          }
        );

        const lista =
          Array.from(
            mapa.values()
          ).sort(
            (
              a,
              b
            ) =>
              a.nome.localeCompare(
                b.nome,
                "pt-BR"
              )
          );

        setMoradoresDaUnidade(
          lista
        );

        setCarregandoMoradores(
          false
        );
      }

      const desligarLegado =
        onValue(
          ref(
            db,
            "qrCentral/moradores"
          ),
          (
            snapshot
          ) => {
            const dados =
              snapshot.val() as
                Record<
                  string,
                  {
                    uid?: string;
                    nome?: string;
                    email?: string;
                    telefone?: string;
                    unidadeId?: string;
                    status?: string;
                  }
                > | null;

            moradoresLegados =
              dados
                ? Object.entries(
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

                        uid:
                          valor.uid,

                        nome:
                          String(
                            valor.nome ||
                            valor.email ||
                            id
                          ),

                        email:
                          valor.email,

                        telefone:
                          valor.telefone,

                        unidadeId:
                          String(
                            valor.unidadeId ||
                            ""
                          ),

                        status:
                          valor.status,
                      })
                    )
                    .filter(
                      (
                        morador
                      ) =>
                        morador.unidadeId ===
                          unidadeId &&
                        morador.status !==
                          "bloqueado" &&
                        morador.status !==
                          "inativo"
                    )
                : [];

            publicarLista();
          }
        );

      const desligarUniversal =
        onValue(
          ref(
            db,
            "usuarios-v2"
          ),
          (
            snapshot
          ) => {
            const dados =
              snapshot.val() as
                Record<
                  string,
                  {
                    uid?: string;
                    nome?: string;
                    email?: string;
                    telefone?: string;
                    status?: string;

                    locais?: Record<
                      string,
                      {
                        unidades?: Record<
                          string,
                          boolean
                        >;
                      }
                    >;

                    condominios?: Record<
                      string,
                      {
                        unidades?: Record<
                          string,
                          boolean
                        >;
                      }
                    >;
                  }
                > | null;

            moradoresUniversais =
              dados
                ? Object.entries(
                    dados
                  )
                    .filter(
                      (
                        [
                          ,
                          pessoa,
                        ]
                      ) => {
                        if (
                          pessoa.status ===
                            "bloqueado" ||
                          pessoa.status ===
                            "inativo"
                        ) {
                          return false;
                        }

                        const vinculos = [
                          ...Object.values(
                            pessoa.locais ||
                              {}
                          ),
                          ...Object.values(
                            pessoa.condominios ||
                              {}
                          ),
                        ];

                        return vinculos.some(
                          (
                            vinculo
                          ) =>
                            vinculo
                              .unidades?.[
                              unidadeId
                            ] === true
                        );
                      }
                    )
                    .map(
                      (
                        [
                          id,
                          pessoa,
                        ]
                      ) => ({
                        id,

                        uid:
                          pessoa.uid,

                        nome:
                          String(
                            pessoa.nome ||
                            pessoa.email ||
                            id
                          ),

                        email:
                          pessoa.email,

                        telefone:
                          pessoa.telefone,

                        unidadeId,

                        status:
                          pessoa.status ||
                          "ativo",
                      })
                    )
                : [];

            publicarLista();
          }
        );

      return () => {
        desligarLegado();
        desligarUniversal();
      };
    },
    [
      unidadeId,
    ]
  );

  const moradoresFiltrados =
    useMemo(
      () => {
        const idsJaVinculados =
          new Set(
            responsaveis.map(
              (
                item
              ) =>
                item.usuarioId
            )
          );

        const termo =
          buscaMorador
            .trim()
            .toLowerCase();

        return moradoresDaUnidade.filter(
          (
            morador
          ) => {
            const identidade =
              morador.uid ||
              morador.id;

            if (
              !editando &&
              idsJaVinculados.has(
                identidade
              )
            ) {
              return false;
            }

            if (
              !termo
            ) {
              return true;
            }

            return [
              morador.nome,
              morador.email,
              morador.telefone,
              morador.id,
              morador.uid,
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
          }
        );
      },
      [
        buscaMorador,
        editando,
        moradoresDaUnidade,
        responsaveis,
      ]
    );

  function abrirNovo() {
    setEditando(
      null
    );

    setBuscaMorador(
      ""
    );

    setMoradorSelecionadoId(
      ""
    );

    setPrioridade(
      String(
        responsaveis.length +
        1
      )
    );

    setStatus(
      "disponivel"
    );

    setModalAberto(
      true
    );
  }

  function abrirEdicao(
    responsavel:
      VinculoResponsavelUnidade
  ) {
    setEditando(
      responsavel
    );

    setBuscaMorador(
      ""
    );

    setMoradorSelecionadoId(
      responsavel.usuarioId
    );

    setPrioridade(
      String(
        responsavel.prioridade
      )
    );

    setStatus(
      responsavel.status
    );

    setModalAberto(
      true
    );
  }

  function fecharModal() {
    if (
      salvando
    ) {
      return;
    }

    setModalAberto(
      false
    );

    setEditando(
      null
    );
  }

  async function salvar() {
    const prioridadeNumero =
      Number(
        prioridade
      );

    if (
      !Number.isFinite(
        prioridadeNumero
      ) ||
      prioridadeNumero <
        1
    ) {
      alert(
        "Informe uma prioridade válida."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      if (
        editando
      ) {
        await Promise.all(
          [
            atualizarPrioridadeResponsavel(
              unidadeId,
              editando.usuarioId,
              prioridadeNumero
            ),

            atualizarStatusResponsavel(
              unidadeId,
              editando.usuarioId,
              status
            ),
          ]
        );

        alert(
          "Responsável atualizado com sucesso."
        );

        setModalAberto(
          false
        );

        setEditando(
          null
        );

        return;
      }

      const morador =
        moradoresDaUnidade.find(
          (
            item
          ) => {
            const identidade =
              item.uid ||
              item.id;

            return identidade ===
              moradorSelecionadoId;
          }
        );

      if (
        !morador
      ) {
        alert(
          "Selecione um morador desta unidade."
        );

        return;
      }

      const usuarioId =
        morador.uid ||
        morador.id;

      await salvarResponsavelVinculado(
        {
          usuarioId,

          unidadeId,

          nome:
            morador.nome,

          telefone:
            morador.telefone,

          prioridade:
            prioridadeNumero,

          status,

          ativo:
            true,
        }
      );

      alert(
        "Responsável adicionado com sucesso."
      );

      setModalAberto(
        false
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao salvar responsável:",
        erro
      );

      alert(
        erro instanceof
        Error
          ? erro.message
          : "Não foi possível salvar o responsável."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  async function remover(
    responsavel:
      VinculoResponsavelUnidade
  ) {
    const confirmar =
      window.confirm(
        `Remover ${responsavel.nome} dos responsáveis desta unidade?`
      );

    if (
      !confirmar
    ) {
      return;
    }

    try {
      await removerResponsavelVinculado(
        unidadeId,
        responsavel.usuarioId
      );

      alert(
        "Responsável removido."
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao remover responsável:",
        erro
      );

      alert(
        "Não foi possível remover o responsável."
      );
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <section className="rounded-2xl border border-blue-800 bg-blue-950/20 p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-blue-300">
              👥 RESPONSÁVEIS DA UNIDADE
            </p>

            <h4 className="mt-1 text-xl font-black text-white">
              Ordem de atendimento
            </h4>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Estas pessoas recebem as chamadas desta unidade conforme a prioridade definida.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNovo
            }
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition-all hover:bg-blue-500 active:scale-95"
          >
            ＋ Adicionar responsável
          </button>
        </div>
      </section>

      {carregando ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="font-black text-slate-300">
            Carregando responsáveis...
          </p>
        </div>
      ) : responsaveis.length ===
        0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
          <div className="text-4xl">
            👥
          </div>

          <p className="mt-3 font-black text-white">
            Nenhum responsável vinculado
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Adicione a primeira pessoa que receberá as chamadas desta unidade.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {responsaveis.map(
            (
              responsavel
            ) => (
              <article
                key={
                  responsavel.id
                }
                className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-2xl">
                      {medalha(
                        responsavel.prioridade
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-blue-300">
                        PRIORIDADE{" "}
                        {
                          responsavel.prioridade
                        }
                      </p>

                      <h5 className="mt-1 truncate text-lg font-black text-white">
                        {
                          responsavel.nome
                        }
                      </h5>

                      {responsavel.telefone && (
                        <p className="mt-1 text-sm text-slate-400">
                          📞{" "}
                          {
                            responsavel.telefone
                          }
                        </p>
                      )}

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black ${
                          responsavel.status ===
                          "disponivel"
                            ? "bg-green-950 text-green-300"
                            : "bg-red-950 text-red-300"
                        }`}
                      >
                        {responsavel.status ===
                        "disponivel"
                          ? "🟢 Disponível"
                          : "🔴 Ausente"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() =>
                        abrirEdicao(
                          responsavel
                        )
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-blue-500 active:scale-95"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        remover(
                          responsavel
                        )
                      }
                      className="rounded-xl bg-red-950 px-4 py-2.5 text-sm font-black text-red-300 transition-all hover:bg-red-900 active:scale-95"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/80 p-3">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-blue-300">
                  {editando
                    ? "EDITAR RESPONSÁVEL"
                    : "ADICIONAR RESPONSÁVEL"}
                </p>

                <h4 className="mt-1 text-2xl font-black text-white">
                  Recebimento de chamadas
                </h4>
              </div>

              <button
                type="button"
                onClick={
                  fecharModal
                }
                disabled={
                  salvando
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl font-black text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {!editando && (
                <>
                  <div className="rounded-xl border border-cyan-800 bg-cyan-950/20 p-3 text-sm text-cyan-200">
                    Mostrando somente os moradores já vinculados a esta unidade.
                  </div>

                  <input
                    value={
                      buscaMorador
                    }
                    onChange={(
                      event
                    ) =>
                      setBuscaMorador(
                        event.target.value
                      )
                    }
                    placeholder="Pesquisar morador por nome, e-mail ou telefone..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <select
                    value={
                      moradorSelecionadoId
                    }
                    onChange={(
                      event
                    ) =>
                      setMoradorSelecionadoId(
                        event.target.value
                      )
                    }
                    disabled={
                      carregandoMoradores
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      {carregandoMoradores
                        ? "Carregando moradores..."
                        : "Selecione o morador"}
                    </option>

                    {moradoresFiltrados.map(
                      (
                        morador
                      ) => {
                        const identidade =
                          morador.uid ||
                          morador.id;

                        return (
                          <option
                            key={
                              identidade
                            }
                            value={
                              identidade
                            }
                          >
                            {
                              morador.nome
                            }
                            {morador.telefone
                              ? ` • ${morador.telefone}`
                              : ""}
                          </option>
                        );
                      }
                    )}
                  </select>

                  {!carregandoMoradores &&
                    moradoresDaUnidade.length ===
                      0 && (
                    <div className="rounded-xl border border-orange-800 bg-orange-950/20 p-3 text-sm text-orange-300">
                      Esta unidade ainda não possui moradores vinculados no cadastro.
                    </div>
                  )}

                  {!carregandoMoradores &&
                    moradoresDaUnidade.length >
                      0 &&
                    moradoresFiltrados.length ===
                      0 && (
                    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300">
                      Todos os moradores desta unidade já foram adicionados como responsáveis, ou nenhum corresponde à pesquisa.
                    </div>
                  )}
                </>
              )}

              {editando && (
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-400">
                    RESPONSÁVEL
                  </p>

                  <p className="mt-1 text-lg font-black text-white">
                    {
                      editando.nome
                    }
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-400">
                  PRIORIDADE
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    prioridade
                  }
                  onChange={(
                    event
                  ) =>
                    setPrioridade(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <p className="text-xs font-black text-slate-400">
                  STATUS
                </p>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setStatus(
                        "disponivel"
                      )
                    }
                    className={`rounded-xl border p-3 font-black transition-all ${
                      status ===
                      "disponivel"
                        ? "border-green-500 bg-green-950/40 text-green-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    🟢 Disponível
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStatus(
                        "ausente"
                      )
                    }
                    className={`rounded-xl border p-3 font-black transition-all ${
                      status ===
                      "ausente"
                        ? "border-red-500 bg-red-950/40 text-red-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    🔴 Ausente
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-blue-900 bg-blue-950/20 p-3 text-sm text-blue-200">
                Push, áudio e encaminhamento para o próximo responsável são automáticos.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-slate-700 py-3 font-black text-white disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    salvar
                  }
                  disabled={
                    salvando ||
                    (
                      !editando &&
                      !moradorSelecionadoId
                    )
                  }
                  className="rounded-xl bg-blue-600 py-3 font-black text-white disabled:bg-slate-600"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

