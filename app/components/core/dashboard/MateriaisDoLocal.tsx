"use client";

import { useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

type MaterialPdfPlugin = {
  abrirPdf(options: { url: string }): Promise<void>;
};

const MaterialPdf =
  registerPlugin<MaterialPdfPlugin>("MaterialPdf");

type QrDownloadPlugin = {
  baixar(options: {
    url: string;
    nomeArquivo: string;
  }): Promise<void>;
};

const QrDownload =
  registerPlugin<QrDownloadPlugin>("QrDownload");

type Props = {
  localId: string;
  visitante?: string;
  morador?: string;
  painel?: string;
  atualizacao?: string;
  titulo?: string;
  placaVertical?: boolean;
};

function montarUrlCompleta(caminho?: string) {
  if (!caminho) return "";

  if (
    caminho.startsWith("http://") ||
    caminho.startsWith("https://")
  ) {
    return caminho;
  }

  if (typeof window === "undefined") {
    return caminho;
  }

  return `${window.location.origin}${caminho}`;
}

function obterUrlQr(
  localId: string,
  formato: "png" | "svg" = "png",
  download = false
) {
  return (
    `/api/qrcode/${encodeURIComponent(localId)}` +
    `?formato=${formato}` +
    `${download ? "&download=1" : ""}`
  );
}

function obterUrlPlaca(
  localId: string,
  orientacao?: "vertical"
) {
  const base = `/api/materiais/qrcode/${encodeURIComponent(localId)}`;
  return orientacao === "vertical"
    ? `${base}?orientacao=vertical`
    : base;
}

export default function MateriaisDoLocal({
  localId,
  visitante,
  morador,
  painel,
  atualizacao,
  titulo = "QR e materiais",
  placaVertical = false,
}: Props) {
  const [copiado, setCopiado] =
    useState<string | null>(null);

  async function abrirPlacaPdfNoApp(
    orientacao?: "vertical"
  ) {
    const url =
      montarUrlCompleta(
        obterUrlPlaca(
          localId,
          orientacao
        )
      );

    try {
      await MaterialPdf.abrirPdf({ url });
    } catch (erro) {
      console.error(
        "Erro ao abrir placa PDF no app:",
        erro
      );

      alert("Não foi possível abrir a placa PDF.");
    }
  }

  async function baixarQrPngNoApp() {
    const url =
      montarUrlCompleta(
        obterUrlQr(localId, "png", true)
      );

    try {
      await QrDownload.baixar({
        url,
        nomeArquivo: `qr-${localId}.png`,
      });
    } catch (erro) {
      console.error(
        "Erro ao baixar QR PNG no app:",
        erro
      );

      alert("Não foi possível baixar o QR PNG.");
    }
  }
  async function baixarQrSvgNoApp() {
    const url =
      montarUrlCompleta(
        obterUrlQr(localId, "svg", true)
      );

    try {
      await QrDownload.baixar({
        url,
        nomeArquivo: `qr-${localId}.svg`,
      });
    } catch (erro) {
      console.error(
        "Erro ao baixar QR SVG no app:",
        erro
      );

      alert("Não foi possível baixar o QR SVG.");
    }
  }
  async function copiarTexto(
    identificador: string,
    texto: string
  ) {
    try {
      await navigator.clipboard.writeText(texto);

      setCopiado(identificador);

      window.setTimeout(() => {
        setCopiado(null);
      }, 1800);
    } catch (erro) {
      console.error("Erro ao copiar:", erro);

      alert("Não foi possível copiar o link.");
    }
  }

  async function copiarTodos() {
    const linhas: string[] = [];

    if (visitante) {
      linhas.push(
        `Visitante: ${montarUrlCompleta(visitante)}`
      );
    }

    if (morador) {
      linhas.push(
        `Morador: ${montarUrlCompleta(morador)}`
      );
    }

    if (painel) {
      linhas.push(
        `Painel: ${montarUrlCompleta(painel)}`
      );
    }

    if (atualizacao) {
      linhas.push(
        `Atualização cadastral: ${montarUrlCompleta(atualizacao)}`
      );
    }

    linhas.push(
      `QR PNG: ${montarUrlCompleta(
        obterUrlQr(localId, "png")
      )}`
    );

    linhas.push(
      `QR SVG: ${montarUrlCompleta(
        obterUrlQr(localId, "svg")
      )}`
    );

    linhas.push(
      `Placa PDF: ${montarUrlCompleta(
        obterUrlPlaca(localId)
      )}`
    );

    await copiarTexto(
      "todos",
      linhas.join("\n")
    );
  }

  if (!localId) {
    return null;
  }

  return (
    <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
      <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
        Materiais
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        {titulo}
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Acesse, baixe ou compartilhe os materiais deste local.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <a
          href={obterUrlQr(localId, "png")}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-center text-sm font-black text-sky-300 transition hover:bg-sky-500/20"
        >
          Ver QR
        </a>

        <a
          href={obterUrlQr(localId, "png", true)}
          onClick={(evento) => {
            if (!Capacitor.isNativePlatform()) {
              return;
            }

            evento.preventDefault();
            void baixarQrPngNoApp();
          }}
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
        >
          PNG
        </a>

        <a
          href={obterUrlQr(localId, "svg", true)}
          onClick={(evento) => {
            if (!Capacitor.isNativePlatform()) {
              return;
            }

            evento.preventDefault();
            void baixarQrSvgNoApp();
          }}
          className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-center text-sm font-black text-fuchsia-300 transition hover:bg-fuchsia-500/20"
        >
          SVG
        </a>

        <a
          href={obterUrlPlaca(localId)}
          target="_blank"
          rel="noreferrer"
          onClick={(evento) => {
            if (!Capacitor.isNativePlatform()) {
              return;
            }

            evento.preventDefault();
            void abrirPlacaPdfNoApp();
          }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20"
        >
          Placa PDF
        </a>

        {placaVertical && (
          <a
            href={obterUrlPlaca(localId, "vertical")}
            target="_blank"
            rel="noreferrer"
            onClick={(evento) => {
              if (!Capacitor.isNativePlatform()) {
                return;
              }

              evento.preventDefault();
              void abrirPlacaPdfNoApp("vertical");
            }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Placa vertical
          </a>
        )}
      </div>

      <div className="mt-5 border-t border-slate-800 pt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
          Materiais de apoio
        </p>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Guia do morador", "QR_Acesso_Guia_Morador_V5_telas_reais_video.pdf"],
            ["Comunicado de implantacao", "QR_Acesso_Comunicado_Implantacao_Moradores_V1.pdf"],
            ["Apresentacao sindico / administradora", "QR_Acesso_Apresentacao_Sindico_Administradora_V1.pdf"],
            ["Modelo de primeiro acesso", "QR_Acesso_Email_Primeiro_Acesso_Modelo_V1.pdf"],
            ["Aviso de inicio da operacao", "QR_Acesso_Aviso_Inicio_Operacao_Moradores_V2_CORRIGIDO.pdf"],
            ["Lembrete de atualizacao cadastral", "QR_Acesso_Lembrete_Atualizacao_Cadastral_V1_CORRIGIDO.pdf"],
            ["Mensagem para WhatsApp", "QR_Acesso_Mensagem_WhatsApp_Implantacao_V1.pdf"],
            ["Duvidas frequentes", "QR_Acesso_Duvidas_Frequentes_Morador_V1_CORRIGIDO.pdf"],
            ["Checklist de implantacao", "QR_Acesso_Checklist_Implantacao_Condominio_V1.pdf"],
            ["Orientacao de contingencia", "QR_Acesso_Orientacao_Contingencia_Moradores_V1.pdf"],
            ["Privacidade e uso responsavel", "QR_Acesso_Privacidade_Uso_Responsavel_Morador_V1.pdf"],
            ["Cartao de suporte", "QR_Acesso_Cartao_Suporte_Morador_V1.pdf"],
            ["Resumo do kit de comunicacao", "QR_Acesso_Kit_Comunicacao_Resumo_V3_CORRIGIDO.pdf"],
          ].map(([rotulo, arquivo]) => (
            <a
              key={arquivo}
              href={`/materiais-apoio/${arquivo}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center text-sm font-black text-violet-300 transition hover:bg-violet-500/20"
            >
              {rotulo}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
          Links
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {visitante && (
            <button
              type="button"
              onClick={() =>
                copiarTexto(
                  "visitante",
                  montarUrlCompleta(visitante)
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-slate-800"
            >
              {copiado === "visitante"
                ? "Link do visitante copiado"
                : "Copiar link do visitante"}
            </button>
          )}

          {morador && (
            <button
              type="button"
              onClick={() =>
                copiarTexto(
                  "morador",
                  montarUrlCompleta(morador)
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-slate-800"
            >
              {copiado === "morador"
                ? "Link do morador copiado"
                : "Copiar link do morador"}
            </button>
          )}

          {atualizacao && (
            <button
              type="button"
              onClick={() =>
                copiarTexto(
                  "atualizacao",
                  montarUrlCompleta(atualizacao)
                )
              }
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-left text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              {copiado === "atualizacao"
                ? "Link de atualização cadastral copiado"
                : "Copiar link de atualização cadastral"}
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              copiarTexto(
                "qr",
                montarUrlCompleta(
                  obterUrlQr(localId, "png")
                )
              )
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-slate-800"
          >
            {copiado === "qr"
              ? "Link do QR copiado"
              : "Copiar link do QR"}
          </button>

          <button
            type="button"
            onClick={copiarTodos}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-black text-amber-300 transition hover:bg-amber-500/20"
          >
            {copiado === "todos"
              ? "Links copiados"
              : "Copiar todos os links"}
          </button>
        </div>
      </div>
    </section>
  );
}
