type Props = {
  filtro: string;
  aoAlterarFiltro: (filtro: string) => void;
};

export default function FiltrosPainel({
  filtro,
  aoAlterarFiltro,
}: Props) {
  return (
    <section className="bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => aoAlterarFiltro("todos")}
          className={`py-3 rounded-xl font-bold ${
            filtro === "todos" ? "bg-blue-600" : "bg-slate-800"
          }`}
        >
          Todos
        </button>

        <button
          type="button"
          onClick={() => aoAlterarFiltro("chamando")}
          className={`py-3 rounded-xl font-bold ${
            filtro === "chamando" ? "bg-green-600" : "bg-slate-800"
          }`}
        >
          Chamando
        </button>

        <button
          type="button"
          onClick={() => aoAlterarFiltro("atendimento")}
          className={`py-3 rounded-xl font-bold ${
            filtro === "atendimento" ? "bg-yellow-600" : "bg-slate-800"
          }`}
        >
          Atendimento
        </button>

        <button
          type="button"
          onClick={() => aoAlterarFiltro("livres")}
          className={`py-3 rounded-xl font-bold ${
            filtro === "livres" ? "bg-slate-600" : "bg-slate-800"
          }`}
        >
          Livres
        </button>
      </div>
    </section>
  );
}