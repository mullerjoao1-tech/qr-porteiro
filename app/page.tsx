"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import CardModulo from "@/app/components/dashboard/CardModulo";
import { useAuth } from "@/app/context/AuthContext";
import { obterModulosDashboard } from "@/app/services/dashboard";

const ferramentasStudio = [
  {
    titulo: "📷 Teste de câmera",
    link: "/teste-camera",
  },
  {
    titulo: "🔵 Teste BLE",
    link: "/teste-ble",
  },
  {
    titulo: "🔐 Teste de acesso",
    link: "/teste-access",
  },
];

function obterMensagemErro(erro: unknown): string {
  if (!(erro instanceof Error)) {
    return "Não foi possível entrar. Tente novamente.";
  }

  const mensagem = erro.message.toLowerCase();

  if (
    mensagem.includes("invalid-credential") ||
    mensagem.includes("wrong-password") ||
    mensagem.includes("user-not-found")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (mensagem.includes("invalid-email")) {
    return "Digite um e-mail válido.";
  }

  if (mensagem.includes("too-many-requests")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }

  if (mensagem.includes("network-request-failed")) {
    return "Falha de conexão. Verifique sua internet.";
  }

  if (mensagem.includes("user-disabled")) {
    return "Este usuário está desativado.";
  }

  return erro.message || "Não foi possível entrar. Tente novamente.";
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
  const { login, recuperarSenha } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const emailLimpo = email.trim().toLowerCase();

    setErro("");
    setMensagem("");

    if (!emailLimpo) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (!senha) {
      setErro("Digite sua senha.");
      return;
    }

    try {
      setEnviando(true);

      await login(emailLimpo, senha);
    } catch (erroLogin) {
      setErro(obterMensagemErro(erroLogin));
    } finally {
      setEnviando(false);
    }
  }

  async function solicitarRecuperacao() {
    const emailLimpo = email.trim().toLowerCase();

    setErro("");
    setMensagem("");

    if (!emailLimpo) {
      setErro(
        "Digite seu e-mail acima para receber o link de recuperação."
      );
      return;
    }

    try {
      setRecuperando(true);

      await recuperarSenha(emailLimpo);

      setMensagem(
        "Enviamos um link de recuperação para o seu e-mail."
      );
    } catch (erroRecuperacao) {
      setErro(obterMensagemErro(erroRecuperacao));
    } finally {
      setRecuperando(false);
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
            onSubmit={entrar}
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
                value={email}
                onChange={(evento) =>
                  setEmail(evento.target.value)
                }
                autoComplete="email"
                inputMode="email"
                placeholder="seuemail@exemplo.com"
                disabled={enviando}
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
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(evento) =>
                    setSenha(evento.target.value)
                  }
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  disabled={enviando}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 pr-20 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha((estadoAtual) => !estadoAtual)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-green-400"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
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
              disabled={enviando}
              className="w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-black text-slate-950 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Entrando..." : "Entrar no QR Acesso"}
            </button>

            <button
              type="button"
              onClick={solicitarRecuperacao}
              disabled={enviando || recuperando}
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
  const { usuario, logout } = useAuth();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    try {
      setSaindo(true);
      await logout();
    } finally {
      setSaindo(false);
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
            {usuario?.nome || usuario?.email || "conectado"}
          </strong>{" "}
          está autenticado, mas ainda não possui vínculo ativo com um
          condomínio, estabelecimento ou outro local do ecossistema QR.
        </p>

        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className="mt-6 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-60"
        >
          {saindo ? "Saindo..." : "Sair da conta"}
        </button>
      </section>
    </main>
  );
}

function PaginaStudio() {
  const {
    usuario,
    vinculoSelecionadoId,
    vinculoSelecionado,
    vinculosAtivos,
    selecionarCarteiraGeral,
    logout,
  } = useAuth();

  const modulos = obterModulosDashboard(
    usuario,
    vinculoSelecionadoId
  );

  const [saindo, setSaindo] = useState(false);

  const nomeContexto =
    vinculoSelecionado?.condominioNome ||
    vinculoSelecionado?.condominioSlug ||
    vinculoSelecionado?.condominioId ||
    vinculoSelecionadoId ||
    "Carteira Geral";

  const isCarteiraGeral =
    vinculoSelecionadoId === null;

  async function sair() {
    try {
      setSaindo(true);
      await logout();
    } finally {
      setSaindo(false);
    }
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
                {usuario?.nome || usuario?.email || "Usuário"}
              </p>

              {usuario?.nome && usuario?.email && (
                <p className="mt-1 truncate text-xs text-slate-400">
                  {usuario.email}
                </p>
              )}

              <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-400">
                  Contexto atual
                </p>

                <p className="mt-1 break-words text-sm font-black text-green-100">
                  {isCarteiraGeral ? "🌐 " : "🏢 "}
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
                  onClick={selecionarCarteiraGeral}
                  disabled={saindo}
                  className="mt-3 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-[0.98] disabled:opacity-60"
                >
                  Voltar para Carteira Geral
                </button>
              )}

              <button
                type="button"
                onClick={sair}
                disabled={saindo}
                className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-60"
              >
                {saindo ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        </header>

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

          {modulos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modulos.map((modulo) => (
                <CardModulo
                  key={modulo.id}
                  modulo={modulo}
                />
              ))}
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
            {ferramentasStudio.map((ferramenta) => (
              <Link
                key={ferramenta.link}
                href={ferramenta.link}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-center font-bold transition-all hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
              >
                {ferramenta.titulo}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
          <h2 className="text-xl font-black text-green-400">
            🚀 Próxima evolução
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Assistente de implantação para cadastrar o local, criar o
            responsável, gerar o login, aplicar vínculos e permissões,
            criar unidades, links e QR Codes automaticamente.
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
  } = useAuth();

  if (carregando) {
    return <TelaCarregando />;
  }

  if (!usuario) {
    return <TelaLogin />;
  }

  if (vinculosAtivos.length === 0) {
    return <TelaSemVinculos />;
  }

  return <PaginaStudio />;
}
