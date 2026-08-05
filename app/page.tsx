"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import CardModulo from "@/app/components/dashboard/CardModulo";

import {
  useAuth,
} from "@/app/context/AuthContext";

import {
  obterModulosDashboard,
} from "@/app/services/dashboard";

import {
  resolverPainelInicial,
} from "@/app/services/navigation/ResolverPainelInicial";

import type {
  VinculoComPermissoes,
} from "@/app/services/permissoes";

const ferramentasStudio = [
  {
    titulo:
      "📷 Teste de câmera",

    link:
      "/teste-camera",
  },
  {
    titulo:
      "🔵 Teste BLE",

    link:
      "/teste-ble",
  },
  {
    titulo:
      "🔐 Teste de acesso",

    link:
      "/teste-access",
  },
];

function obterMensagemErro(
  erro:
    unknown
): string {
  if (
    !(erro instanceof Error)
  ) {
    return "Não foi possível entrar. Tente novamente.";
  }

  const mensagem =
    erro.message.toLowerCase();

  if (
    mensagem.includes(
      "invalid-credential"
    ) ||
    mensagem.includes(
      "wrong-password"
    ) ||
    mensagem.includes(
      "user-not-found"
    )
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    mensagem.includes(
      "invalid-email"
    )
  ) {
    return "Digite um e-mail válido.";
  }

  if (
    mensagem.includes(
      "too-many-requests"
    )
  ) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }

  if (
    mensagem.includes(
      "network-request-failed"
    )
  ) {
    return "Falha de conexão. Verifique sua internet.";
  }

  if (
    mensagem.includes(
      "user-disabled"
    )
  ) {
    return "Este usuário está desativado.";
  }

  return (
    erro.message ||
    "Não foi possível entrar. Tente novamente."
  );
}

function obterTipoLocal(
  vinculo:
    VinculoComPermissoes
): string {
  return (
    vinculo.tipoLocal
      ?.trim()
      .toLowerCase() ||
    "local"
  );
}

function obterIconeLocal(
  vinculo:
    VinculoComPermissoes
): string {
  const tipo =
    obterTipoLocal(
      vinculo
    );

  switch (tipo) {
    case "condominio":
      return "🏢";

    case "residencia":
      return "🏠";

    case "beauty":
      return "💅";

    case "barbearia":
      return "💈";

    case "clinica":
      return "🏥";

    case "empresa":
      return "🏭";

    case "restaurante":
      return "🍽️";

    case "pet":
      return "🐾";

    default:
      return "📍";
  }
}

function obterNomeLocal(
  vinculoId:
    string,
  vinculo:
    VinculoComPermissoes
): string {
  return (
    vinculo.localNome ||
    vinculo.condominioNome ||
    vinculo.localSlug ||
    vinculo.condominioSlug ||
    vinculo.localId ||
    vinculo.condominioId ||
    vinculoId
  );
}

function obterSlugLocal(
  vinculo:
    VinculoComPermissoes
): string {
  return (
    vinculo.localSlug ||
    vinculo.condominioSlug ||
    ""
  );
}

function obterPerfilLocal(
  vinculo:
    VinculoComPermissoes
): string {
  const perfil =
    vinculo.perfilPrincipal ||
    Object.entries(
      vinculo.perfis ??
      {}
    ).find(
      (
        [
          ,
          ativo,
        ]
      ) =>
        ativo === true
    )?.[0] ||
    "usuário";

  return perfil
    .replaceAll(
      "_",
      " "
    )
    .replaceAll(
      "-",
      " "
    )
    .replace(
      /\b\w/g,
      (
        letra
      ) =>
        letra.toUpperCase()
    );
}

function TelaCarregando() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-green-500" />

        <p className="mt-4 text-sm font-bold text-slate-300">
          Carregando QR Acesso...
        </p>
      </div>
    </main>
  );
}

function TelaLogin() {
  const {
    login,
    recuperarSenha,
  } =
    useAuth();

  const [
    email,
    setEmail,
  ] =
    useState(
      ""
    );

  const [
    senha,
    setSenha,
  ] =
    useState(
      ""
    );

  const [
    mostrarSenha,
    setMostrarSenha,
  ] =
    useState(
      false
    );

  const [
    enviando,
    setEnviando,
  ] =
    useState(
      false
    );

  const [
    recuperando,
    setRecuperando,
  ] =
    useState(
      false
    );

  const [
    erro,
    setErro,
  ] =
    useState(
      ""
    );

  const [
    mensagem,
    setMensagem,
  ] =
    useState(
      ""
    );

  async function entrar(
    evento:
      FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    const emailLimpo =
      email
        .trim()
        .toLowerCase();

    setErro(
      ""
    );

    setMensagem(
      ""
    );

    if (!emailLimpo) {
      setErro(
        "Digite seu e-mail."
      );

      return;
    }

    if (!senha) {
      setErro(
        "Digite sua senha."
      );

      return;
    }

    try {
      setEnviando(
        true
      );

      await login(
        emailLimpo,
        senha
      );
    } catch (
      erroLogin
    ) {
      setErro(
        obterMensagemErro(
          erroLogin
        )
      );
    } finally {
      setEnviando(
        false
      );
    }
  }

  async function solicitarRecuperacao() {
    const emailLimpo =
      email
        .trim()
        .toLowerCase();

    setErro(
      ""
    );

    setMensagem(
      ""
    );

    if (!emailLimpo) {
      setErro(
        "Digite seu e-mail acima para receber o link de recuperação."
      );

      return;
    }

    try {
      setRecuperando(
        true
      );

      await recuperarSenha(
        emailLimpo
      );

      setMensagem(
        "Enviamos um link de recuperação para o seu e-mail."
      );
    } catch (
      erroRecuperacao
    ) {
      setErro(
        obterMensagemErro(
          erroRecuperacao
        )
      );
    } finally {
      setRecuperando(
        false
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-md">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500">
              <span className="text-3xl font-black text-slate-950">
                QR
              </span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              Ecossistema QR Acesso
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Entrar
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Acesse a plataforma com seu e-mail e senha.
            </p>
          </div>

          <form
            onSubmit={
              entrar
            }
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-200"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={
                  email
                }
                onChange={
                  (
                    evento
                  ) =>
                    setEmail(
                      evento.target.value
                    )
                }
                autoComplete="email"
                inputMode="email"
                placeholder="seuemail@exemplo.com"
                disabled={
                  enviando
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-bold text-slate-200"
              >
                Senha
              </label>

              <div className="relative">
                <input
                  id="senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={
                    senha
                  }
                  onChange={
                    (
                      evento
                    ) =>
                      setSenha(
                        evento.target.value
                      )
                  }
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  disabled={
                    enviando
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 pr-20 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={
                    () =>
                      setMostrarSenha(
                        (
                          estadoAtual
                        ) =>
                          !estadoAtual
                      )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-green-400"
                >
                  {mostrarSenha
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </div>

            {erro && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={
                enviando
              }
              className="w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-black text-slate-950 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando
                ? "Entrando..."
                : "Entrar no QR Acesso"}
            </button>

            <button
              type="button"
              onClick={
                solicitarRecuperacao
              }
              disabled={
                enviando ||
                recuperando
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recuperando
                ? "Enviando recuperação..."
                : "Esqueci minha senha"}
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-slate-600">
          QR Acesso Studio • Ambiente de desenvolvimento e homologação
        </p>
      </div>
    </main>
  );
}

function TelaSemVinculos() {
  const {
    usuario,
    logout,
  } =
    useAuth();

  const [
    saindo,
    setSaindo,
  ] =
    useState(
      false
    );

  async function sair() {
    try {
      setSaindo(
        true
      );

      await logout();
    } finally {
      setSaindo(
        false
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/15 text-4xl">
          ⚠️
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
          Acesso pendente
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Nenhum local disponível
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          O usuário{" "}
          <strong>
            {usuario?.nome ||
              usuario?.email ||
              "conectado"}
          </strong>{" "}
          está autenticado, mas ainda não possui vínculo ativo com um
          condomínio, estabelecimento ou outro local do ecossistema QR.
        </p>

        <button
          type="button"
          onClick={
            sair
          }
          disabled={
            saindo
          }
          className="mt-6 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-60"
        >
          {saindo
            ? "Saindo..."
            : "Sair da conta"}
        </button>
      </section>
    </main>
  );
}

function CardLocal({
  vinculoId,
  vinculo,
  selecionado,
  aoSelecionar,
}: {
  vinculoId:
    string;

  vinculo:
    VinculoComPermissoes;

  selecionado:
    boolean;

  aoSelecionar:
    (
      vinculoId:
        string
    ) => void;
}) {
  const nome =
    obterNomeLocal(
      vinculoId,
      vinculo
    );

  const slug =
    obterSlugLocal(
      vinculo
    );

  const tipo =
    obterTipoLocal(
      vinculo
    );

  const perfil =
    obterPerfilLocal(
      vinculo
    );

  const icone =
    obterIconeLocal(
      vinculo
    );

  return (
    <article
      className={[
        "rounded-3xl border p-5 transition",
        selecionado
          ? "border-green-500 bg-green-500/10"
          : "border-slate-800 bg-slate-900 hover:border-slate-700",
      ].join(
        " "
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-3xl">
          {icone}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-green-400">
            {tipo}
          </p>

          <h3 className="mt-1 break-words text-lg font-black text-white">
            {nome}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-300">
            {perfil}
          </p>

          {slug && (
            <p className="mt-1 break-all text-xs text-slate-500">
              {slug}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={
          () =>
            aoSelecionar(
              vinculoId
            )
        }
        className={[
          "mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.98]",
          selecionado
            ? "bg-green-500 text-slate-950 hover:bg-green-400"
            : "border border-slate-700 bg-slate-800 text-white hover:border-green-500 hover:bg-slate-700",
        ].join(
          " "
        )}
      >
        {selecionado
          ? "Local selecionado"
          : "Entrar neste local"}
      </button>
    </article>
  );
}

function PaginaStudio() {
  const router =
    useRouter();

  const {
    usuario,
    vinculoSelecionadoId,
    vinculoSelecionado,
    vinculosAtivos,
    selecionarVinculo,
    selecionarCarteiraGeral,
    logout,
  } =
    useAuth();

  const modulos =
    obterModulosDashboard(
      usuario,
      vinculoSelecionadoId
    );

  const [
    saindo,
    setSaindo,
  ] =
    useState(
      false
    );

  const [
    erroSelecao,
    setErroSelecao,
  ] =
    useState(
      ""
    );

  const nomeContexto =
    vinculoSelecionado
      ? obterNomeLocal(
          vinculoSelecionadoId ||
            "",
          vinculoSelecionado
        )
      : "Carteira Geral";

  const isCarteiraGeral =
    vinculoSelecionadoId ===
    null;

  const locaisOrdenados =
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
            obterNomeLocal(
              idA,
              vinculoA
            ).localeCompare(
              obterNomeLocal(
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

  async function sair() {
    try {
      setSaindo(
        true
      );

      await logout();
    } finally {
      setSaindo(
        false
      );
    }
  }

  function entrarNoLocal(
    vinculoId:
      string
  ) {
    try {
      setErroSelecao(
        ""
      );

      const modulosPermitidos =
        obterModulosDashboard(
          usuario,
          vinculoId
        );

      const vinculo =
        vinculosAtivos.find(
          (
            [
              id,
            ]
          ) =>
            id ===
            vinculoId
        )?.[1];

      if (!vinculo) {
        throw new Error(
          "O vínculo selecionado não foi encontrado."
        );
      }

      if (
        modulosPermitidos.length ===
        0
      ) {
        throw new Error(
          "Este local não possui nenhum módulo liberado para o usuário."
        );
      }

      const rotaInicial =
        resolverPainelInicial({
          usuario,

          vinculoId,

          vinculo,

          modulosPermitidos,
        });

      selecionarVinculo(
        vinculoId
      );

      router.push(
        rotaInicial
      );
    } catch (
      erro
    ) {
      setErroSelecao(
        erro instanceof Error
          ? erro.message
          : "Não foi possível selecionar este local."
      );
    }
  }

  function abrirCarteiraGeral() {
    setErroSelecao(
      ""
    );

    selecionarCarteiraGeral();

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-green-500">
                <span className="text-3xl font-black text-slate-950">
                  QR
                </span>
              </div>

              <div>
                <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-green-400">
                  Ambiente de desenvolvimento
                </p>

                <h1 className="text-3xl font-black sm:text-4xl">
                  QR Acesso Studio
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Desenvolvimento, testes e homologação dos módulos do
                  ecossistema QR Acesso.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-center sm:min-w-64 sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Usuário conectado
              </p>

              <p className="mt-1 truncate font-black text-white">
                {usuario?.nome ||
                  usuario?.email ||
                  "Usuário"}
              </p>

              {usuario?.nome &&
                usuario?.email && (
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {usuario.email}
                  </p>
                )}

              <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-400">
                  Contexto atual
                </p>

                <p className="mt-1 break-words text-sm font-black text-green-100">
                  {isCarteiraGeral
                    ? "🌐 "
                    : `${obterIconeLocal(
                        vinculoSelecionado as
                          VinculoComPermissoes
                      )} `}
                  {nomeContexto}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  {isCarteiraGeral
                    ? `${vinculosAtivos.length} local(is) vinculado(s)`
                    : "Visão específica do local"}
                </p>
              </div>

              {!isCarteiraGeral && (
                <button
                  type="button"
                  onClick={
                    abrirCarteiraGeral
                  }
                  disabled={
                    saindo
                  }
                  className="mt-3 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-[0.98] disabled:opacity-60"
                >
                  Voltar para Carteira Geral
                </button>
              )}

              <button
                type="button"
                onClick={
                  sair
                }
                disabled={
                  saindo
                }
                className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-60"
              >
                {saindo
                  ? "Saindo..."
                  : "Sair"}
              </button>
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                Login Único QR Core
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Escolha onde deseja entrar
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                Use a Carteira Geral para uma visão consolidada ou selecione
                um local para carregar somente os perfis, permissões e
                módulos daquele contexto.
              </p>
            </div>

            <button
              type="button"
              onClick={
                abrirCarteiraGeral
              }
              className={[
                "rounded-2xl px-5 py-3 text-sm font-black transition active:scale-[0.98]",
                isCarteiraGeral
                  ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
              ].join(
                " "
              )}
            >
              🌐 Abrir Carteira Geral
            </button>
          </div>

          {erroSelecao && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {erroSelecao}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locaisOrdenados.map(
              (
                [
                  vinculoId,
                  vinculo,
                ]
              ) => (
                <CardLocal
                  key={
                    vinculoId
                  }
                  vinculoId={
                    vinculoId
                  }
                  vinculo={
                    vinculo
                  }
                  selecionado={
                    vinculoSelecionadoId ===
                    vinculoId
                  }
                  aoSelecionar={
                    entrarNoLocal
                  }
                />
              )
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black">
              Módulos liberados
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {isCarteiraGeral
                ? "A Carteira Geral considera as permissões consolidadas dos locais vinculados ao usuário."
                : "Os módulos abaixo consideram somente as permissões do local selecionado."}
            </p>
          </div>

          {modulos.length >
          0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modulos.map(
                (
                  modulo
                ) => (
                  <CardModulo
                    key={
                      modulo.id
                    }
                    modulo={
                      modulo
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
              <h3 className="font-black text-amber-300">
                Nenhum módulo liberado
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Este usuário possui vínculo ativo, mas ainda não tem
                permissão para acessar os módulos disponíveis.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              🧪 Ferramentas de homologação
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Atalhos temporários para testes técnicos do Studio.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {ferramentasStudio.map(
              (
                ferramenta
              ) => (
                <Link
                  key={
                    ferramenta.link
                  }
                  href={
                    ferramenta.link
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-center font-bold transition-all hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
                >
                  {ferramenta.titulo}
                </Link>
              )
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
          <h2 className="text-xl font-black text-green-400">
            🚀 Implantação Universal
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            O Studio já possui a base para cadastrar o local, criar o
            responsável, gerar o login, aplicar vínculos e permissões,
            criar estruturas, URLs, QR Code e material A4 automaticamente.
          </p>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-500">
          QR Acesso Studio • Desenvolvimento e homologação
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  const {
    usuario,
    carregando,
    vinculosAtivos,
  } =
    useAuth();

  if (
    carregando
  ) {
    return (
      <TelaCarregando />
    );
  }

  if (!usuario) {
    return (
      <TelaLogin />
    );
  }

  if (
    vinculosAtivos.length ===
    0
  ) {
    return (
      <TelaSemVinculos />
    );
  }

  return (
    <PaginaStudio />
  );
}
