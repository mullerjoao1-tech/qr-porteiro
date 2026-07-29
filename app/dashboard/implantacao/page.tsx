"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import { auth } from "@/app/services/firebase";

import Stepper from "./components/Stepper";

import PassoTipoLocal, {
  type TipoLocal,
} from "./components/PassoTipoLocal";

import PassoDadosLocal from "./components/PassoDadosLocal";
import PassoResponsavel from "./components/PassoResponsavel";
import PassoResumo from "./components/PassoResumo";

import PassoConfiguracaoSegmento, {
  type ConfiguracaoSegmento,
} from "./components/PassoConfiguracaoSegmento";

import type {
  ConfiguracaoCondominioDados,
} from "./components/segmentos/ConfiguracaoCondominio";

import type {
  ConfiguracaoBeautyDados,
} from "./components/segmentos/ConfiguracaoBeauty";

type ResultadoImplantacao = {
  sucesso: boolean;

  mensagem?: string;
  erro?: string;

  usuario?: {
    uid: string;
    nome: string;
    email: string;
  };

  local?: {
    id: string;
    nome: string;
    slug: string;
    tipo: string;
  };
};

const TOTAL_PASSOS = 5;

const CONFIGURACAO_CONDOMINIO_INICIAL:
  ConfiguracaoCondominioDados = {
    tipoCondominio: "vertical",

    quantidadeBlocos: 1,

    apartamentosPorBloco: 0,

    quantidadeCasas: 0,

    possuiPortaria: true,

    tipoPortaria:
      "presencial-24h",

    possuiVisitantes: true,

    possuiEntregas: true,

    possuiReservas: true,

    possuiCameras: false,

    possuiAberturaRemota: false,

    possuiPrestadores: true,

    possuiComunicados: true,
  };

const CONFIGURACAO_BEAUTY_INICIAL:
  ConfiguracaoBeautyDados = {
    quantidadeProfissionais: 1,

    trabalhaComAgenda: true,

    possuiFilaEspera: true,

    possuiAntecipacaoAgenda: true,

    possuiConfirmacaoAutomatica: true,

    possuiCaixa: true,

    possuiEstoque: false,

    possuiCRM: true,

    possuiWhatsApp: false,

    possuiPainelTV: false,
  };

function criarConfiguracaoInicial(
  tipoLocal: TipoLocal
): ConfiguracaoSegmento {
  if (tipoLocal === "condominio") {
    return {
      tipo: "condominio",

      dados: {
        ...CONFIGURACAO_CONDOMINIO_INICIAL,
      },
    };
  }

  if (tipoLocal === "beauty") {
    return {
      tipo: "beauty",

      dados: {
        ...CONFIGURACAO_BEAUTY_INICIAL,
      },
    };
  }

  return {
    tipo: tipoLocal,

    dados: {},
  };
}

function gerarSlug(
  valor: string
): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

function obterResumoConfiguracao(
  configuracao:
    ConfiguracaoSegmento
): string[] {
  if (
    configuracao.tipo ===
    "condominio"
  ) {
    const dados =
      configuracao.dados;

    const itens = [
      `Tipo: ${dados.tipoCondominio}`,
      `Portaria: ${
        dados.possuiPortaria
          ? dados.tipoPortaria
          : "Não possui"
      }`,
      `Visitantes: ${
        dados.possuiVisitantes
          ? "Sim"
          : "Não"
      }`,
      `Entregas: ${
        dados.possuiEntregas
          ? "Sim"
          : "Não"
      }`,
      `Reservas: ${
        dados.possuiReservas
          ? "Sim"
          : "Não"
      }`,
    ];

    if (
      dados.tipoCondominio ===
        "vertical" ||
      dados.tipoCondominio ===
        "misto"
    ) {
      itens.push(
        `Blocos: ${dados.quantidadeBlocos}`
      );

      itens.push(
        `Apartamentos por bloco: ${dados.apartamentosPorBloco}`
      );
    }

    if (
      dados.tipoCondominio ===
        "horizontal" ||
      dados.tipoCondominio ===
        "misto"
    ) {
      itens.push(
        `Casas: ${dados.quantidadeCasas}`
      );
    }

    return itens;
  }

  if (
    configuracao.tipo ===
    "beauty"
  ) {
    const dados =
      configuracao.dados;

    return [
      `Profissionais: ${dados.quantidadeProfissionais}`,

      `Agenda: ${
        dados.trabalhaComAgenda
          ? "Sim"
          : "Não"
      }`,

      `Fila de espera: ${
        dados.possuiFilaEspera
          ? "Sim"
          : "Não"
      }`,

      `Caixa: ${
        dados.possuiCaixa
          ? "Sim"
          : "Não"
      }`,

      `CRM: ${
        dados.possuiCRM
          ? "Sim"
          : "Não"
      }`,
    ];
  }

  return [
    "Configuração específica ainda não disponível.",
  ];
}

export default function ImplantacaoPage() {
  const [
    passoAtual,
    setPassoAtual,
  ] = useState(1);

  const [
    tipoLocal,
    setTipoLocal,
  ] =
    useState<TipoLocal>(
      "condominio"
    );

  const [
    configuracaoSegmento,
    setConfiguracaoSegmento,
  ] =
    useState<ConfiguracaoSegmento>(
      criarConfiguracaoInicial(
        "condominio"
      )
    );

  const [
    localNome,
    setLocalNome,
  ] = useState("");

  const [
    localSlug,
    setLocalSlug,
  ] = useState("");

  const [
    slugEditado,
    setSlugEditado,
  ] = useState(false);

  const [
    cidade,
    setCidade,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState("");

  const [
    endereco,
    setEndereco,
  ] = useState("");

  const [
    responsavelNome,
    setResponsavelNome,
  ] = useState("");

  const [
    responsavelEmail,
    setResponsavelEmail,
  ] = useState("");

  const [
    responsavelTelefone,
    setResponsavelTelefone,
  ] = useState("");

  const [
    senhaProvisoria,
    setSenhaProvisoria,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    resultado,
    setResultado,
  ] =
    useState<ResultadoImplantacao | null>(
      null
    );

  const configuracaoResumo =
    useMemo(
      () =>
        obterResumoConfiguracao(
          configuracaoSegmento
        ),
      [
        configuracaoSegmento,
      ]
    );

  const passoValido =
    useMemo(() => {
      if (passoAtual === 1) {
        return Boolean(
          tipoLocal
        );
      }

      if (passoAtual === 2) {
        return (
          localNome.trim().length >=
            3 &&
          localSlug.trim().length >=
            3
        );
      }

      if (passoAtual === 3) {
        return (
          responsavelNome
            .trim()
            .length >= 3 &&
          responsavelEmail.includes(
            "@"
          ) &&
          senhaProvisoria.length >=
            6
        );
      }

      if (
        passoAtual === 4 &&
        configuracaoSegmento.tipo ===
          "condominio"
      ) {
        const dados =
          configuracaoSegmento.dados;

        if (
          dados.tipoCondominio ===
          "vertical"
        ) {
          return (
            dados.quantidadeBlocos >
              0 &&
            dados.apartamentosPorBloco >
              0
          );
        }

        if (
          dados.tipoCondominio ===
          "horizontal"
        ) {
          return (
            dados.quantidadeCasas >
            0
          );
        }

        return (
          dados.quantidadeBlocos >
            0 &&
          dados.apartamentosPorBloco >
            0 &&
          dados.quantidadeCasas >
            0
        );
      }

      if (
        passoAtual === 4 &&
        configuracaoSegmento.tipo ===
          "beauty"
      ) {
        return (
          configuracaoSegmento
            .dados
            .quantidadeProfissionais >=
          0
        );
      }

      return true;
    }, [
      passoAtual,
      tipoLocal,
      localNome,
      localSlug,
      responsavelNome,
      responsavelEmail,
      senhaProvisoria,
      configuracaoSegmento,
    ]);

  function selecionarTipoLocal(
    novoTipo: TipoLocal
  ) {
    setTipoLocal(novoTipo);

    setConfiguracaoSegmento(
      criarConfiguracaoInicial(
        novoTipo
      )
    );
  }

  function alterarNomeLocal(
    valor: string
  ) {
    setLocalNome(valor);

    if (!slugEditado) {
      setLocalSlug(
        gerarSlug(valor)
      );
    }
  }

  function alterarSlug(
    valor: string
  ) {
    setSlugEditado(true);

    setLocalSlug(
      gerarSlug(valor)
    );
  }

  function avancar() {
    setErro("");

    if (!passoValido) {
      setErro(
        "Preencha os campos obrigatórios antes de continuar."
      );

      return;
    }

    setPassoAtual(
      (atual) =>
        Math.min(
          atual + 1,
          TOTAL_PASSOS
        )
    );
  }

  function voltar() {
    setErro("");

    setPassoAtual(
      (atual) =>
        Math.max(
          atual - 1,
          1
        )
    );
  }

  async function implantar() {
    setErro("");
    setResultado(null);

    const usuarioAtual =
      auth.currentUser;

    if (!usuarioAtual) {
      setErro(
        "Sua sessão expirou. Entre novamente."
      );

      return;
    }

    try {
      setSalvando(true);

      const token =
        await usuarioAtual.getIdToken(
          true
        );

      const resposta =
        await fetch(
          "/api/implantacao/criar-responsavel",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              nome:
                responsavelNome.trim(),

              email:
                responsavelEmail
                  .trim()
                  .toLowerCase(),

              telefone:
                responsavelTelefone.trim(),

              senhaProvisoria,

              localId:
                localSlug,

              localNome:
                localNome.trim(),

              localSlug,

              tipoLocal,

              cidade:
                cidade.trim(),

              estado:
                estado
                  .trim()
                  .toUpperCase(),

              endereco:
                endereco.trim(),

              perfil:
                "sindico",

              configuracaoSegmento,
            }),
          }
        );

      const dados =
        (await resposta.json()) as ResultadoImplantacao;

      if (
        !resposta.ok ||
        !dados.sucesso
      ) {
        throw new Error(
          dados.erro ||
            "Não foi possível concluir a implantação."
        );
      }

      setResultado(dados);
      setSenhaProvisoria("");
    } catch (
      erroImplantacao
    ) {
      setErro(
        erroImplantacao instanceof
          Error
          ? erroImplantacao.message
          : "Não foi possível concluir a implantação."
      );
    } finally {
      setSalvando(false);
    }
  }

  function novaImplantacao() {
    setPassoAtual(1);

    setTipoLocal(
      "condominio"
    );

    setConfiguracaoSegmento(
      criarConfiguracaoInicial(
        "condominio"
      )
    );

    setLocalNome("");
    setLocalSlug("");
    setSlugEditado(false);

    setCidade("");
    setEstado("");
    setEndereco("");

    setResponsavelNome("");
    setResponsavelEmail("");
    setResponsavelTelefone("");
    setSenhaProvisoria("");
    setMostrarSenha(false);

    setErro("");
    setResultado(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-700 to-cyan-600 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                QR Core
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                🚀 Nova Implantação
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100">
                Crie o local, o
                responsável, o login, os
                vínculos, a configuração
                do segmento e as
                permissões iniciais em um
                único fluxo.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/40 bg-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/25 active:scale-[0.98]"
            >
              ← Voltar
            </Link>
          </div>
        </header>

        <div className="mt-5">
          <Stepper
            passoAtual={
              passoAtual
            }
            totalPassos={
              TOTAL_PASSOS
            }
          />
        </div>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
          {resultado?.sucesso ? (
            <div className="text-center">
              <div className="text-6xl">
                ✅
              </div>

              <h2 className="mt-4 text-3xl font-black text-green-300">
                Implantação concluída
              </h2>

              <p className="mt-3 text-slate-300">
                {resultado.mensagem}
              </p>

              <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-left text-sm text-slate-300">
                <p>
                  <strong>
                    Local:
                  </strong>{" "}
                  {
                    resultado.local
                      ?.nome
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Slug:
                  </strong>{" "}
                  {
                    resultado.local
                      ?.slug
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Tipo:
                  </strong>{" "}
                  {
                    resultado.local
                      ?.tipo
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Responsável:
                  </strong>{" "}
                  {
                    resultado.usuario
                      ?.nome
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    E-mail:
                  </strong>{" "}
                  {
                    resultado.usuario
                      ?.email
                  }
                </p>

                <p className="mt-2 break-all">
                  <strong>
                    UID:
                  </strong>{" "}
                  {
                    resultado.usuario
                      ?.uid
                  }
                </p>
              </div>

              <section className="mx-auto mt-6 max-w-xl rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  QR principal do local
                </p>

                <h3 className="mt-2 text-xl font-black text-white">
                  {
                    resultado.local
                      ?.nome
                  }
                </h3>

                <div className="mt-5 flex justify-center">
                  <img
                    src={`/api/qrcode/${resultado.local?.id || resultado.local?.slug}`}
                    alt={`QR Code principal de ${resultado.local?.nome || "local"}`}
                    className="w-72 rounded-2xl border border-slate-700 bg-white p-4 shadow-xl"
                  />
                </div>

                <p className="mt-4 break-all text-center text-sm text-slate-400">
                  {typeof window !==
                  "undefined"
                    ? `${window.location.origin}/acesso-v2/${resultado.local?.slug}`
                    : `/acesso-v2/${resultado.local?.slug}`}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href={`/api/qrcode/${resultado.local?.id || resultado.local?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-cyan-600 px-5 py-3 text-center font-black text-white transition hover:bg-cyan-500 active:scale-[0.98]"
                  >
                    👁 Visualizar QR
                  </a>

                  <a
                    href={`/api/qrcode/${resultado.local?.id || resultado.local?.slug}?download=1`}
                    className="rounded-xl bg-green-600 px-5 py-3 text-center font-black text-white transition hover:bg-green-500 active:scale-[0.98]"
                  >
                    ⬇ Baixar PNG
                  </a>

                  <a
                    href={`/api/qrcode/${resultado.local?.id || resultado.local?.slug}?formato=svg&download=1`}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-center font-black text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                  >
                    ⬇ Baixar SVG
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      const link =
                        `${window.location.origin}/acesso-v2/${resultado.local?.slug}`;

                      await navigator.clipboard.writeText(
                        link
                      );
                    }}
                    className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white transition hover:bg-slate-600 active:scale-[0.98]"
                  >
                    📋 Copiar link
                  </button>
                </div>
              </section>

              <button
                type="button"
                onClick={
                  novaImplantacao
                }
                className="mt-6 rounded-2xl bg-green-500 px-6 py-4 font-black text-slate-950 transition hover:bg-green-400 active:scale-[0.98]"
              >
                + Nova implantação
              </button>
            </div>
          ) : (
            <>
              {passoAtual === 1 && (
                <PassoTipoLocal
                  valor={
                    tipoLocal
                  }
                  onChange={
                    selecionarTipoLocal
                  }
                />
              )}

              {passoAtual === 2 && (
                <PassoDadosLocal
                  nome={
                    localNome
                  }
                  slug={
                    localSlug
                  }
                  cidade={
                    cidade
                  }
                  estado={
                    estado
                  }
                  endereco={
                    endereco
                  }
                  onNomeChange={
                    alterarNomeLocal
                  }
                  onSlugChange={
                    alterarSlug
                  }
                  onCidadeChange={
                    setCidade
                  }
                  onEstadoChange={
                    setEstado
                  }
                  onEnderecoChange={
                    setEndereco
                  }
                />
              )}

              {passoAtual === 3 && (
                <PassoResponsavel
                  nome={
                    responsavelNome
                  }
                  email={
                    responsavelEmail
                  }
                  telefone={
                    responsavelTelefone
                  }
                  senha={
                    senhaProvisoria
                  }
                  mostrarSenha={
                    mostrarSenha
                  }
                  onNomeChange={
                    setResponsavelNome
                  }
                  onEmailChange={
                    setResponsavelEmail
                  }
                  onTelefoneChange={
                    setResponsavelTelefone
                  }
                  onSenhaChange={
                    setSenhaProvisoria
                  }
                  onMostrarSenhaChange={
                    setMostrarSenha
                  }
                />
              )}

              {passoAtual === 4 && (
                <PassoConfiguracaoSegmento
                  tipoLocal={
                    tipoLocal
                  }
                  configuracao={
                    configuracaoSegmento
                  }
                  onChange={
                    setConfiguracaoSegmento
                  }
                />
              )}

              {passoAtual === 5 && (
                <>
                  <PassoResumo
                    tipoLocal={
                      tipoLocal
                    }
                    localNome={
                      localNome
                    }
                    localSlug={
                      localSlug
                    }
                    cidade={
                      cidade
                    }
                    estado={
                      estado
                    }
                    endereco={
                      endereco
                    }
                    responsavelNome={
                      responsavelNome
                    }
                    responsavelEmail={
                      responsavelEmail
                    }
                    responsavelTelefone={
                      responsavelTelefone
                    }
                  />

                  <section className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      Configuração do
                      segmento
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      {configuracaoResumo.map(
                        (
                          item,
                          indice
                        ) => (
                          <p
                            key={`${item}-${indice}`}
                          >
                            ✅ {item}
                          </p>
                        )
                      )}
                    </div>
                  </section>
                </>
              )}

              {erro && (
                <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                  {erro}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={
                    voltar
                  }
                  disabled={
                    passoAtual === 1 ||
                    salvando
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 font-black text-slate-200 transition hover:bg-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Voltar
                </button>

                {passoAtual <
                TOTAL_PASSOS ? (
                  <button
                    type="button"
                    onClick={
                      avancar
                    }
                    disabled={
                      !passoValido
                    }
                    className="rounded-2xl bg-green-500 px-6 py-4 font-black text-slate-950 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próximo →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      implantar
                    }
                    disabled={
                      salvando
                    }
                    className="rounded-2xl bg-green-500 px-6 py-4 font-black text-slate-950 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salvando
                      ? "Implantando..."
                      : "🚀 Confirmar implantação"}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
