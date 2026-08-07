"use client";

type Props = {
  titulo: string;
  descricao: string;
  icone: string;
};

export default function ModuloPreparado({
  titulo,
  descricao,
  icone,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
      <div className="text-5xl">{icone}</div>

      <h3 className="mt-4 text-2xl font-black text-white">
        {titulo}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
        {descricao}
      </p>

      <div className="mx-auto mt-5 inline-flex rounded-full border border-blue-800 bg-blue-950/30 px-4 py-2 text-xs font-black text-blue-300">
        Estrutura preparada
      </div>
    </section>
  );
}
