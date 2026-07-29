"use client";

export type TipoLocal =
  | "condominio"
  | "beauty"
  | "barbearia"
  | "clinica"
  | "empresa"
  | "residencia"
  | "restaurante"
  | "outro";

type Props = {
  valor: TipoLocal;

  onChange: (
    tipo: TipoLocal
  ) => void;
};

const opcoes: Array<{
  id: TipoLocal;
  titulo: string;
  descricao: string;
  icone: string;
}> = [
  {
    id: "condominio",
    titulo: "Condomínio",
    descricao:
      "Condomínios residenciais e comerciais",
    icone: "🏢",
  },
  {
    id: "beauty",
    titulo: "Beauty",
    descricao:
      "Salões, esmalterias e estética",
    icone: "💅",
  },
  {
    id: "barbearia",
    titulo: "Barbearia",
    descricao:
      "Barbearias e estúdios masculinos",
    icone: "💈",
  },
  {
    id: "clinica",
    titulo: "Clínica",
    descricao:
      "Clínicas e consultórios",
    icone: "🏥",
  },
  {
    id: "empresa",
    titulo: "Empresa",
    descricao:
      "Empresas e escritórios",
    icone: "🏭",
  },
  {
    id: "residencia",
    titulo: "Residência",
    descricao:
      "Residências e casas independentes",
    icone: "🏠",
  },
  {
    id: "restaurante",
    titulo: "Restaurante",
    descricao:
      "Restaurantes, bares e alimentação",
    icone: "🍽️",
  },
  {
    id: "outro",
    titulo: "Outro",
    descricao:
      "Outro tipo de operação",
    icone: "➕",
  },
];

export default function PassoTipoLocal({
  valor,
  onChange,
}: Props) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-wider text-green-400">
        Tipo do local
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        O que será implantado?
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Escolha o segmento inicial. A
        estrutura específica será configurada
        nas próximas etapas.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {opcoes.map((opcao) => {
          const selecionada =
            valor === opcao.id;

          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() =>
                onChange(opcao.id)
              }
              className={`rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
                selecionada
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 bg-slate-950 hover:border-slate-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {opcao.icone}
                </span>

                <div>
                  <h3 className="font-black text-white">
                    {opcao.titulo}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {opcao.descricao}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}