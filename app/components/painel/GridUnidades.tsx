import CardUnidade, {
  type UnidadePainel,
} from "./CardUnidade";

type Props = {
  unidades: UnidadePainel[];
  carregando: boolean;
  aoAbrirUnidade: (unidade: UnidadePainel) => void;
};

export default function GridUnidades({
  unidades,
  carregando,
  aoAbrirUnidade,
}: Props) {
  if (carregando) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 text-center text-slate-400">
        Carregando unidades...
      </div>
    );
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {unidades.map((unidade) => (
        <CardUnidade
          key={unidade.id}
          unidade={unidade}
          aoAbrir={aoAbrirUnidade}
        />
      ))}
    </section>
  );
}