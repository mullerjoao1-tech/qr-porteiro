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

type TemaVisual =
  | "clean"
  | "institucional"
  | "premium";

type IdentidadeVisual = {
  corPrimaria: string;
  corSecundaria: string;
  corTexto: string;
  tema: TemaVisual;
};

const IDENTIDADE_VISUAL_INICIAL: IdentidadeVisual = {
  corPrimaria: "#0F4C81",
  corSecundaria: "#EAF4FF",
  corTexto: "#0F172A",
  tema: "clean",
};

const TOTAL_PASSOS = 6;

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
    identidadeVisual,
    setIdentidadeVisual,
  ] = useState<IdentidadeVisual>({
    ...IDENTIDADE_VISUAL_INICIAL,
  });

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

              identidadeVisual,
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

    setIdentidadeVisual({
      ...IDENTIDADE_VISUAL_INICIAL,
    });

    setResponsavelNome("");
    setResponsavelEmail("");
    setResponsavelTelefone("");
    setSenhaProvisoria("");
    setMostrarSenha(false);

    setErro("");
    setResultado(null);
  }

  function obterLinkAcesso(): string {
    if (!resultado?.local?.slug) {
      return "";
    }

    const caminho =
      `/acesso-v2/${resultado.local.slug}`;

    return typeof window !==
      "undefined"
      ? `${window.location.origin}${caminho}`
      : caminho;
  }

  function obterLinkPainel(): string {
    if (!resultado?.local) {
      return "";
    }

   const identificador =
  resultado.local.slug;

    if (!identificador) {
      return "";
    }

    const tipo =
      resultado.local.tipo;

    if (
      tipo === "residencia"
    ) {
      return `/morador-v2/${identificador}-principal`;
    }

    return `/dashboard`;
  }

  function abrirPlacaImpressao() {
    if (
      typeof window ===
        "undefined" ||
      !resultado?.local
    ) {
      return;
    }

    const identificador =
  resultado.local.slug;

    const linkAcesso =
      obterLinkAcesso();

    const qrUrl =
      `${window.location.origin}` +
      `/api/qrcode/${identificador}`;

    const nomeLocal =
      resultado.local.nome ||
      "Local QR Acesso";

    const tipoLocal =
      resultado.local.tipo ||
      "local";

    const janela =
      window.open(
        "",
        "_blank"
      );

    if (!janela) {
      setErro(
        "O navegador bloqueou a abertura da placa. Permita pop-ups e tente novamente."
      );
      return;
    }

    const documento = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <title>Placa QR Acesso - ${nomeLocal}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #e2e8f0;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            .acoes {
              display: flex;
              justify-content: center;
              gap: 12px;
              padding: 18px;
            }

            .acoes button {
              border: 0;
              border-radius: 12px;
              padding: 12px 20px;
              font-size: 15px;
              font-weight: 800;
              cursor: pointer;
            }

            .imprimir {
              background: #22c55e;
              color: #052e16;
            }

            .fechar {
              background: #334155;
              color: #ffffff;
            }

            .pagina {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto 24px;
              padding: 18mm;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .placa {
              width: 100%;
              min-height: 250mm;
              border: 4px solid ${identidadeVisual.corPrimaria};
              border-radius: 28px;
              padding: 18mm 14mm;
              text-align: center;
              background: ${identidadeVisual.corSecundaria};
              color: ${identidadeVisual.corTexto};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }

            .marca {
              margin: 0;
              color: ${identidadeVisual.corPrimaria};
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            h1 {
              margin: 12px 0 8px;
              font-size: 38px;
              line-height: 1.08;
            }

            .instrucao {
              margin: 0;
              max-width: 560px;
              font-size: 21px;
              line-height: 1.45;
            }

            .qr {
              width: 118mm;
              height: 118mm;
              margin: 18mm 0 10mm;
              border: 2px solid #cbd5e1;
              border-radius: 22px;
              padding: 10mm;
              background: #ffffff;
              object-fit: contain;
            }

            .tipo {
              margin: 0 0 8px;
              color: ${identidadeVisual.corPrimaria};
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
            }

            .link {
              margin: 0;
              max-width: 100%;
              overflow-wrap: anywhere;
              font-size: 15px;
              font-weight: 700;
            }

            .rodape {
              margin-top: 15mm;
              font-size: 13px;
              font-weight: 700;
              opacity: 0.75;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .acoes {
                display: none;
              }

              .pagina {
                margin: 0;
                padding: 12mm;
              }

              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="acoes">
            <button
              class="imprimir"
              onclick="window.print()"
            >
              Imprimir / salvar em PDF
            </button>

            <button
              class="fechar"
              onclick="window.close()"
            >
              Fechar
            </button>
          </div>

          <main class="pagina">
            <section class="placa">
              <p class="marca">
                QR Acesso
              </p>

              <h1>
                ${nomeLocal}
              </h1>

              <p class="instrucao">
                Aponte a câmera do celular para o QR Code e chame o responsável.
              </p>

              <img
                class="qr"
                src="${qrUrl}"
                alt="QR Code de ${nomeLocal}"
              />

              <p class="tipo">
                ${tipoLocal}
              </p>

              <p class="link">
                ${linkAcesso}
              </p>

              <p class="rodape">
                Acesso rápido, seguro e sem aplicativo.
              </p>
            </section>
          </main>
        </body>
      </html>
    `;

    janela.document.open();
    janela.document.write(
      documento
    );
    janela.document.close();
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
                    src={`/api/qrcode/${resultado.local?.slug}`}
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
                   href={`/api/qrcode/${resultado.local?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-cyan-600 px-5 py-3 text-center font-black text-white transition hover:bg-cyan-500 active:scale-[0.98]"
                  >
                    👁 Visualizar QR
                  </a>

                  <a
                    href={`/api/qrcode/${resultado.local?.slug}?download=1`}
                    className="rounded-xl bg-green-600 px-5 py-3 text-center font-black text-white transition hover:bg-green-500 active:scale-[0.98]"
                  >
                    ⬇ Baixar PNG
                  </a>

                  <a
                    href={`/api/qrcode/${resultado.local?.slug}?formato=svg&download=1`}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-center font-black text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                  >
                    ⬇ Baixar SVG
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      const link =
                        obterLinkAcesso();

                      await navigator.clipboard.writeText(
                        link
                      );
                    }}
                    className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white transition hover:bg-slate-600 active:scale-[0.98]"
                  >
                    📋 Copiar link
                  </button>

                  <a
                    href={obterLinkAcesso()}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white transition hover:bg-blue-500 active:scale-[0.98]"
                  >
                    🌐 Abrir acesso do visitante
                  </a>

                  <a
                    href={obterLinkPainel()}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-amber-500 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-amber-400 active:scale-[0.98]"
                  >
                    🏠 Abrir painel do responsável
                  </a>

                  <button
                    type="button"
                    onClick={
                      abrirPlacaImpressao
                    }
                    className="sm:col-span-2 rounded-xl bg-fuchsia-600 px-5 py-3 font-black text-white transition hover:bg-fuchsia-500 active:scale-[0.98]"
                  >
                    🖨️ Visualizar / imprimir placa A4
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
                <section>
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                      Identidade visual
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-white">
                      Escolha o tema e as cores do local
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Essas escolhas serão usadas nos materiais, placas e futuras telas personalizadas.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {([
                      {
                        id: "clean",
                        nome: "Clean",
                        descricao: "Visual limpo, direto e com destaque para o QR.",
                      },
                      {
                        id: "institucional",
                        nome: "Institucional",
                        descricao: "Mais explicativo, ideal para condomínios e grande fluxo.",
                      },
                      {
                        id: "premium",
                        nome: "Premium",
                        descricao: "Apresentação sofisticada com identidade mais marcante.",
                      },
                    ] as const).map((tema) => {
                      const selecionado =
                        identidadeVisual.tema === tema.id;

                      return (
                        <button
                          key={tema.id}
                          type="button"
                          onClick={() =>
                            setIdentidadeVisual((atual) => ({
                              ...atual,
                              tema: tema.id,
                            }))
                          }
                          className={`rounded-2xl border p-5 text-left transition active:scale-[0.98] ${
                            selecionado
                              ? "border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/30"
                              : "border-slate-700 bg-slate-800 hover:border-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-lg font-black text-white">
                              {tema.nome}
                            </p>

                            <span
                              className={`h-5 w-5 rounded-full border-2 ${
                                selecionado
                                  ? "border-cyan-300 bg-cyan-400"
                                  : "border-slate-500"
                              }`}
                            />
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-slate-400">
                            {tema.descricao}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {[
                      {
                        campo: "corPrimaria",
                        titulo: "Cor primária",
                      },
                      {
                        campo: "corSecundaria",
                        titulo: "Cor secundária",
                      },
                      {
                        campo: "corTexto",
                        titulo: "Cor do texto",
                      },
                    ].map((item) => (
                      <label
                        key={item.campo}
                        className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
                      >
                        <span className="text-sm font-black text-slate-200">
                          {item.titulo}
                        </span>

                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="color"
                            value={
                              identidadeVisual[
                                item.campo as keyof Pick<
                                  IdentidadeVisual,
                                  "corPrimaria" | "corSecundaria" | "corTexto"
                                >
                              ]
                            }
                            onChange={(evento) =>
                              setIdentidadeVisual((atual) => ({
                                ...atual,
                                [item.campo]: evento.target.value.toUpperCase(),
                              }))
                            }
                            className="h-12 w-16 cursor-pointer rounded-lg border border-slate-600 bg-transparent"
                          />

                          <input
                            value={
                              identidadeVisual[
                                item.campo as keyof Pick<
                                  IdentidadeVisual,
                                  "corPrimaria" | "corSecundaria" | "corTexto"
                                >
                              ]
                            }
                            onChange={(evento) =>
                              setIdentidadeVisual((atual) => ({
                                ...atual,
                                [item.campo]: evento.target.value.toUpperCase(),
                              }))
                            }
                            maxLength={7}
                            className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-mono text-sm text-white outline-none focus:border-cyan-400"
                          />
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Prévia
                    </p>

                    <div
                      className="mt-4 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                      style={{
                        backgroundColor: identidadeVisual.corSecundaria,
                        color: identidadeVisual.corTexto,
                      }}
                    >
                      <div
                        className="px-5 py-4"
                        style={{
                          backgroundColor: identidadeVisual.corPrimaria,
                        }}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                          QR Acesso
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-white">
                          {localNome || "Nome do local"}
                        </h3>
                      </div>

                      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_150px] sm:items-center">
                        <div>
                          <p className="text-xs font-black uppercase opacity-60">
                            Tema selecionado
                          </p>

                          <p className="mt-1 text-xl font-black capitalize">
                            {identidadeVisual.tema}
                          </p>

                          <p className="mt-3 text-sm leading-relaxed opacity-75">
                            Aponte a câmera do celular para acessar o local de forma rápida e segura.
                          </p>
                        </div>

                        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl bg-white p-3 shadow-xl">
                          <div className="grid h-full w-full grid-cols-5 gap-1">
                            {Array.from({ length: 25 }).map((_, indice) => (
                              <span
                                key={indice}
                                className={
                                  indice % 3 === 0 || indice % 7 === 0
                                    ? "bg-slate-950"
                                    : "bg-white"
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {passoAtual === 6 && (
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

                  <section className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                      Identidade visual
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>✅ Tema: <strong className="capitalize">{identidadeVisual.tema}</strong></p>
                      <p>✅ Cor primária: <strong>{identidadeVisual.corPrimaria}</strong></p>
                      <p>✅ Cor secundária: <strong>{identidadeVisual.corSecundaria}</strong></p>
                      <p>✅ Cor do texto: <strong>{identidadeVisual.corTexto}</strong></p>
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
