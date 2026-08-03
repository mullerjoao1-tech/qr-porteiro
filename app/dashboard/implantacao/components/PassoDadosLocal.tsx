"use client";

type Props = {
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  endereco: string;

  onNomeChange: (
    valor: string
  ) => void;

  onSlugChange: (
    valor: string
  ) => void;

  onCidadeChange: (
    valor: string
  ) => void;

  onEstadoChange: (
    valor: string
  ) => void;

  onEnderecoChange: (
    valor: string
  ) => void;
};

export default function PassoDadosLocal({
  nome,
  slug,
  cidade,
  estado,
  endereco,
  onNomeChange,
  onSlugChange,
  onCidadeChange,
  onEstadoChange,
  onEnderecoChange,
}: Props) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-wider text-green-400">
        Dados do local
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        Identificação principal
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Informe os dados básicos do local.
        O slug será usado nos links e na
        identificação interna do QR Core.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="local-nome"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Nome do local
          </label>

          <input
            id="local-nome"
            type="text"
            value={nome}
            onChange={(evento) =>
              onNomeChange(
                evento.target.value
              )
            }
            placeholder="Ex.: Residencial Tulipas"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="local-slug"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Slug / identificador
          </label>

          <input
            id="local-slug"
            type="text"
            value={slug}
            onChange={(evento) =>
              onSlugChange(
                evento.target.value
              )
            }
            placeholder="residencial-tulipas"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            O sistema gera automaticamente
            com base no nome, mas você pode
            revisar antes de implantar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div>
            <label
              htmlFor="local-cidade"
              className="mb-2 block text-sm font-bold text-slate-200"
            >
              Cidade
            </label>

            <input
              id="local-cidade"
              type="text"
              value={cidade}
              onChange={(evento) =>
                onCidadeChange(
                  evento.target.value
                )
              }
              placeholder="Curitiba"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="local-estado"
              className="mb-2 block text-sm font-bold text-slate-200"
            >
              Estado
            </label>

            <input
              id="local-estado"
              type="text"
              value={estado}
              onChange={(evento) =>
                onEstadoChange(
                  evento.target.value
                    .toUpperCase()
                    .slice(0, 2)
                )
              }
              placeholder="PR"
              maxLength={2}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="local-endereco"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Endereço
          </label>

          <input
            id="local-endereco"
            type="text"
            value={endereco}
            onChange={(evento) =>
              onEnderecoChange(
                evento.target.value
              )
            }
            placeholder="Rua, número e complemento"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />
        </div>
      </div>
    </section>
  );
}