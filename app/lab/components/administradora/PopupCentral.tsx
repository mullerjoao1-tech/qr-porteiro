"use client";

import Link from "next/link";

type ItemPopup = {
  nome: string;
  descricao: string;
  horario: string;
  status?: string;
  acao?: string;
};

type PopupCentralProps = {
  aberto: boolean;
  titulo: string;
  icone: string;
  valor: string;
  descricao: string;
  corTexto: string;
  itens: ItemPopup[];
  aoFechar: () => void;
};

function gerarSlug(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PopupCentral({
  aberto,
  titulo,
  icone,
  valor,
  descricao,
  corTexto,
  itens,
  aoFechar,
}: PopupCentralProps) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 p-4"
      style={{
        height: "100dvh",
      }}
    >
      <div className="mx-auto min-h-full w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl">
        <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 rounded-t-3xl border-b border-slate-100 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-black ${corTexto}`}>
                {icone} {titulo}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {valor} {descricao}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Detalhes do grupo selecionado.
              </p>
            </div>

            <button
              type="button"
              onClick={aoFechar}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-black uppercase text-slate-500">
              Condomínios
            </p>

            <p className="text-xl font-black text-slate-950">
              {itens.length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-black uppercase text-slate-500">
              Atualização
            </p>

            <p className="text-xl font-black text-slate-950">
              Agora
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-black uppercase text-slate-500">
              Ação
            </p>

            <p className="text-xl font-black text-slate-950">
              {titulo === "Crítico" ? "Alta" : "Normal"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {itens.map((item) => (
            <div
              key={`${item.nome}-${item.descricao}`}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-lg font-black text-slate-900">
                🏢 {item.nome}
              </h3>

              {item.status && (
                <p className="mt-1 text-sm font-black text-slate-700">
                  {item.status}
                </p>
              )}

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {item.descricao}
              </p>

              <p className="mt-2 text-xs font-bold text-slate-500">
                {item.horario}
              </p>

              <Link
                href={`/lab/condominio/${gerarSlug(item.nome)}`}
                onClick={aoFechar}
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
              >
                {item.acao || "Abrir condomínio"} →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-sm font-black">
            🤖 Sugestão inteligente
          </p>

          <p className="mt-1 text-sm text-slate-300">
            Comece pelos itens críticos e depois revise as pendências do dia.
            No futuro a IA do QR Acesso fará essa análise automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}