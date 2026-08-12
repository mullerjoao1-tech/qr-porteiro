"use client";

import { useState } from "react";

type Props = {
  localId: string;
  visitante?: string;
  morador?: string;
  painel?: string;
  titulo?: string;
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

function obterUrlPlaca(localId: string) {
  return `/api/materiais/qrcode/${encodeURIComponent(localId)}`;
}

export default function MateriaisDoLocal({
  localId,
  visitante,
  morador,
  painel,
  titulo = "QR e materiais",
}: Props) {
  const [copiado, setCopiado] =
    useState<string | null>(null);

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
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
        >
          PNG
        </a>

        <a
          href={obterUrlQr(localId, "svg", true)}
          className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-center text-sm font-black text-fuchsia-300 transition hover:bg-fuchsia-500/20"
        >
          SVG
        </a>

        <a
          href={obterUrlPlaca(localId)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20"
        >
          Placa PDF
        </a>
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
