"use client";

import Link from "next/link";
import { useState } from "react";

type LocalImplantado = {
  id: string;
  nome: string;
  tipo: "Condomínio" | "Residência";
  ambiente: "Studio" | "Produção";
  status: "Ativo" | "Em implantação";
  visitante?: string;
  painel?: string;
  morador?: string;
};

const locais: LocalImplantado[] = [
  {
    id: "residencial-tulipas",
    nome: "Residencial Tulipas",
    tipo: "Condomínio",
    ambiente: "Studio",
    status: "Ativo",
    visitante: "/acesso-v2/residencial-tulipas",
    painel: "/dashboard/sindico",
    morador: "/morador-v2/residencial-tulipas-bloco-1-ap-11",
  },
  {
    id: "muller",
    nome: "Müller",
    tipo: "Residência",
    ambiente: "Produção",
    status: "Ativo",
    visitante: "/acesso-v2/muller",
    morador: "/morador-v2/muller-principal",
  },
  {
    id: "residencial-costa",
    nome: "Residencial Costa",
    tipo: "Residência",
    ambiente: "Produção",
    status: "Ativo",
    visitante: "/acesso-v2/residencial-costa",
    morador: "/morador-v2/residencial-costa-casa-principal",
  },
];

function CardIndicador({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: number;
  descricao: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {valor}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {descricao}
      </p>
    </div>
  );
}

function montarUrlCompleta(caminho?: string) {
  if (!caminho) {
    return "";
  }

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

export default function PaginaLocaisImplantados() {
  const [copiado, setCopiado] = useState<string | null>(null);

  const total = locais.length;

  const ativos = locais.filter(
    (local) => local.status === "Ativo"
  ).length;

  const producao = locais.filter(
    (local) => local.ambiente === "Produção"
  ).length;

  const studio = locais.filter(
    (local) => local.ambiente === "Studio"
  ).length;

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

  async function copiarLinksLocal(local: LocalImplantado) {
    const linhas: string[] = [];

    if (local.visitante) {
      linhas.push(
        `Visitante: ${montarUrlCompleta(local.visitante)}`
      );
    }

    if (local.morador) {
      linhas.push(
        `Morador: ${montarUrlCompleta(local.morador)}`
      );
    }

    if (local.painel) {
      linhas.push(
        `Painel: ${montarUrlCompleta(local.painel)}`
      );
    }

    linhas.push(
      `QR PNG: ${montarUrlCompleta(
        obterUrlQr(local.id, "png")
      )}`
    );

    linhas.push(
      `QR SVG: ${montarUrlCompleta(
        obterUrlQr(local.id, "svg")
      )}`
    );

    linhas.push(
      `Placa PDF: ${montarUrlCompleta(
        obterUrlPlaca(local.id)
      )}`
    );

    await copiarTexto(
      `todos-${local.id}`,
      linhas.join("`n")
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6 md:p-8">
          <p className="text-sm font-black uppercase tracking-wider text-cyan-400">
            QR CORE • IMPLANTAÇÃO
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Locais Implantados
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Acompanhe os locais já implantados, seus acessos,
            materiais, ambiente e status operacional.
          </p>

          <div className="mt-5">
            <Link
              href="/dashboard/implantacao"
              className="inline-flex rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-slate-700"
            >
              ← Voltar para Implantação
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <CardIndicador
            titulo="Total"
            valor={total}
            descricao="Locais implantados"
          />

          <CardIndicador
            titulo="Ativos"
            valor={ativos}
            descricao="Operacionais"
          />

          <CardIndicador
            titulo="Produção"
            valor={producao}
            descricao="Ambiente real"
          />

          <CardIndicador
            titulo="Studio"
            valor={studio}
            descricao="Homologação"
          />
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {locais.map((local) => (
            <article
              key={local.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    {local.tipo}
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {local.nome}
                  </h2>
                </div>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-black text-emerald-400">
                  {local.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Ambiente
                  </p>

                  <p className="mt-1 font-black">
                    {local.ambiente}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Tipo
                  </p>

                  <p className="mt-1 font-black">
                    {local.tipo}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {local.visitante && (
                  <Link
                    href={local.visitante}
                    target="_blank"
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center text-sm font-black text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    Visitante
                  </Link>
                )}

                {local.morador && (
                  <Link
                    href={local.morador}
                    target="_blank"
                    className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center text-sm font-black text-violet-300 transition hover:bg-violet-500/20"
                  >
                    Morador
                  </Link>
                )}

                {local.painel && (
                  <Link
                    href={local.painel}
                    target="_blank"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    Painel
                  </Link>
                )}

                <Link
                  href="/dashboard/implantacao"
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-center text-sm font-black text-slate-200 transition hover:bg-slate-700"
                >
                  Implantação
                </Link>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-5">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                  Materiais
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={obterUrlQr(local.id, "png")}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-center text-sm font-black text-sky-300 transition hover:bg-sky-500/20"
                  >
                    Ver QR
                  </a>

                  <a
                    href={obterUrlQr(local.id, "png", true)}
                    className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
                  >
                    PNG
                  </a>

                  <a
                    href={obterUrlQr(local.id, "svg", true)}
                    className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-center text-sm font-black text-fuchsia-300 transition hover:bg-fuchsia-500/20"
                  >
                    SVG
                  </a>

                  <a
                    href={obterUrlPlaca(local.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    Placa PDF
                  </a>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-5">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                  Links
                </p>

                <div className="grid gap-3">
                  {local.visitante && (
                    <button
                      type="button"
                      onClick={() =>
                        copiarTexto(
                          `visitante-${local.id}`,
                          montarUrlCompleta(local.visitante)
                        )
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                    >
                      {copiado === `visitante-${local.id}`
                        ? "Link do visitante copiado"
                        : "Copiar link do visitante"}
                    </button>
                  )}

                  {local.morador && (
                    <button
                      type="button"
                      onClick={() =>
                        copiarTexto(
                          `morador-${local.id}`,
                          montarUrlCompleta(local.morador)
                        )
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                    >
                      {copiado === `morador-${local.id}`
                        ? "Link do morador copiado"
                        : "Copiar link do morador"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      copiarTexto(
                        `qr-${local.id}`,
                        montarUrlCompleta(
                          obterUrlQr(local.id, "png")
                        )
                      )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                  >
                    {copiado === `qr-${local.id}`
                      ? "Link do QR copiado"
                      : "Copiar link do QR"}
                  </button>

                  <button
                    type="button"
                    onClick={() => copiarLinksLocal(local)}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-black text-amber-300 transition hover:bg-amber-500/20"
                  >
                    {copiado === `todos-${local.id}`
                      ? "Links copiados"
                      : "Copiar todos os links"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
