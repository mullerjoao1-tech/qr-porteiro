"use client";

type ItemMenu = {
  titulo: string;
  icone: string;
  ativo?: boolean;
};

const itens: ItemMenu[] = [
  { titulo: "Home", icone: "🏠", ativo: true },
  { titulo: "Moradores", icone: "👥" },
  { titulo: "Visitantes", icone: "🚪" },
  { titulo: "Entregas", icone: "📦" },
  { titulo: "Comunicados", icone: "📢" },
  { titulo: "Financeiro", icone: "💰" },
  { titulo: "Mais", icone: "➕" },
];

export default function MenuPrincipal() {
  return (
    <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {itens.map((item) => (
          <button
            key={item.titulo}
            className={`flex min-w-max items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
              item.ativo
                ? "bg-slate-950 text-white"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>{item.icone}</span>
            <span>{item.titulo}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}