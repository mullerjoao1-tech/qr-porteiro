type Props = {
  totalUnidades: number;
  totalChamando: number;
  totalAtendimento: number;
  totalLivres: number;
};

export default function KPIsPainel({
  totalUnidades,
  totalChamando,
  totalAtendimento,
  totalLivres,
}: Props) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center">
        <p className="text-3xl font-black">{totalUnidades}</p>
        <p className="text-xs text-slate-400">Unidades</p>
      </div>

      <div className="bg-slate-900 border border-green-700 rounded-2xl p-4 text-center">
        <p className="text-3xl font-black text-green-400">
          {totalChamando}
        </p>
        <p className="text-xs text-slate-400">Chamando</p>
      </div>

      <div className="bg-slate-900 border border-yellow-700 rounded-2xl p-4 text-center">
        <p className="text-3xl font-black text-yellow-400">
          {totalAtendimento}
        </p>
        <p className="text-xs text-slate-400">Em atendimento</p>
      </div>

      <div className="bg-slate-900 border border-blue-700 rounded-2xl p-4 text-center">
        <p className="text-3xl font-black text-blue-400">
          {totalLivres}
        </p>
        <p className="text-xs text-slate-400">Livres</p>
      </div>
    </section>
  );
}