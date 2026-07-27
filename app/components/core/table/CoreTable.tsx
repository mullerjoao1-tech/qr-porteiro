"use client";

import { useQRTheme } from "../provider";

import type {
  CoreTableProps,
} from "./CoreTableTypes";

export default function CoreTable<T>({
  titulo,
  subtitulo,
  colunas,
  dados,
  vazioTitulo = "Nenhum registro encontrado",
  vazioDescricao = "Não existem dados para exibir.",
  onLinhaClick,
}: CoreTableProps<T>) {
  const theme = useQRTheme();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
      {(titulo || subtitulo) && (
        <header className="border-b border-slate-800 p-5">
          {titulo && (
            <h2 className="text-2xl font-black text-white">
              {titulo}
            </h2>
          )}

          {subtitulo && (
            <p className="mt-1 text-sm text-slate-400">
              {subtitulo}
            </p>
          )}
        </header>
      )}

      {dados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="text-5xl">
            {theme.icone}
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            {vazioTitulo}
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-400">
            {vazioDescricao}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-950">
              <tr>
                {colunas.map((coluna) => (
                  <th
                    key={coluna.id}
                    style={{
                      width: coluna.largura,
                    }}
                    className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                  >
                    {coluna.titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dados.map((item, index) => (
                <tr
                  key={index}
                  onClick={() =>
                    onLinhaClick?.(item)
                  }
                  className={`border-t border-slate-800 transition-all ${
                    onLinhaClick
                      ? "cursor-pointer hover:bg-slate-800"
                      : ""
                  }`}
                >
                  {colunas.map((coluna) => (
                    <td
                      key={coluna.id}
                      className="px-5 py-4 text-sm text-slate-200"
                    >
                      {coluna.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}