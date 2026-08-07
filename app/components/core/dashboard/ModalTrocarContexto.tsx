"use client";

import {
  useMemo,
} from "react";

import {
  useAuth,
} from "@/app/context/AuthContext";

type Props = {
  aberto: boolean;

  onFechar: () => void;
};

function nomeLocal(
  vinculoId: string,
  vinculo: any
) {
  return (
    vinculo.localNome ||
    vinculo.condominioNome ||
    vinculo.nome ||
    vinculo.localSlug ||
    vinculo.condominioSlug ||
    vinculoId
  );
}

function tipoLocal(
  vinculo: any
) {
  const tipo =
    (
      vinculo.tipoLocal ||
      vinculo.tipo ||
      "local"
    )
      .toString()
      .trim()
      .toLowerCase();

  const nomes:
    Record<
      string,
      string
    > = {
      condominio:
        "Condomínio",

      residencia:
        "Residência",

      beauty:
        "Beauty",

      barbearia:
        "Barbearia",

      empresa:
        "Empresa",

      clinica:
        "Clínica",

      restaurante:
        "Restaurante",

      pet:
        "Pet",
    };

  return (
    nomes[tipo] ||
    tipo
  );
}

function nomePerfil(
  perfil: string
) {
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
        .trim()
        .toLowerCase()
    ] ||
    perfil
  );
}

function obterPerfis(
  vinculo: any
) {
  const perfis =
    new Set<string>();

  if (
    vinculo.perfilPrincipal
  ) {
    perfis.add(
      vinculo.perfilPrincipal
    );
  }

  Object.entries(
    vinculo.perfis ||
      {}
  ).forEach(
    ([
      perfil,
      ativo,
    ]) => {
      if (
        ativo === true
      ) {
        perfis.add(
          perfil
        );
      }
    }
  );

  return Array.from(
    perfis
  );
}

export default function ModalTrocarContexto({
  aberto,
  onFechar,
}: Props) {
  const {
    vinculosAtivos,
    vinculoSelecionadoId,
    selecionarVinculo,
    selecionarCarteiraGeral,
  } =
    useAuth();

  const locais =
    useMemo(
      () =>
        [
          ...vinculosAtivos,
        ].sort(
          (
            [
              idA,
              vinculoA,
            ],
            [
              idB,
              vinculoB,
            ]
          ) =>
            nomeLocal(
              idA,
              vinculoA
            ).localeCompare(
              nomeLocal(
                idB,
                vinculoB
              ),
              "pt-BR"
            )
        ),
      [
        vinculosAtivos,
      ]
    );

  if (!aberto) {
    return null;
  }

  function escolherLocal(
    vinculoId: string
  ) {
    selecionarVinculo(
      vinculoId
    );

    onFechar();
  }

  function abrirCarteira() {
    selecionarCarteiraGeral();

    onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={
        onFechar
      }
    >
      <section
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl"
        onMouseDown={(
          evento
        ) =>
          evento.stopPropagation()
        }
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
              QR Core
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Trocar contexto
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Escolha outro local sem sair da sua conta.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onFechar
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-xl font-black text-slate-300 transition hover:bg-slate-800"
          >
            ×
          </button>
        </header>

        <div className="max-h-[62vh] overflow-y-auto p-6">
          <button
            type="button"
            onClick={
              abrirCarteira
            }
            className="mb-5 w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-left transition hover:bg-cyan-500/20"
          >
            <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
              🌐 Visão consolidada
            </p>

            <p className="mt-1 text-lg font-black text-white">
              Carteira Geral
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Visualizar todos os locais vinculados.
            </p>
          </button>

          <div className="grid gap-4 sm:grid-cols-2">
            {locais.map(
              ([
                vinculoId,
                vinculo,
              ]) => {
                const selecionado =
                  vinculoSelecionadoId ===
                  vinculoId;

                const perfis =
                  obterPerfis(
                    vinculo
                  );

                return (
                  <button
                    key={
                      vinculoId
                    }
                    type="button"
                    onClick={() =>
                      escolherLocal(
                        vinculoId
                      )
                    }
                    className={[
                      "rounded-3xl border p-5 text-left transition active:scale-[0.99]",
                      selecionado
                        ? "border-green-500 bg-green-950/30"
                        : "border-slate-700 bg-slate-900 hover:border-cyan-500",
                    ].join(
                      " "
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-2xl">
                        🏢
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-green-400">
                          {tipoLocal(
                            vinculo
                          )}
                        </p>

                        <h3 className="mt-1 truncate text-lg font-black text-white">
                          {nomeLocal(
                            vinculoId,
                            vinculo
                          )}
                        </h3>

                        {perfis.length >
                          0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {perfis.map(
                              (
                                perfil
                              ) => (
                                <span
                                  key={
                                    perfil
                                  }
                                  className="rounded-full border border-blue-500/40 bg-blue-950/40 px-3 py-1 text-[10px] font-black text-blue-300"
                                >
                                  {nomePerfil(
                                    perfil
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {selecionado && (
                          <p className="mt-3 text-xs font-black text-green-400">
                            ✓ Contexto atual
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {locais.length ===
            0 && (
            <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5">
              <p className="font-black text-amber-300">
                Nenhum local disponível.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
