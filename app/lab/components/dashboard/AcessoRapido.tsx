"use client";

const modulos = [
  { icone: "👥", titulo: "Moradores", valor: "184", descricao: "cadastrados", status: "🟢 Atualizado" },
  { icone: "🏠", titulo: "Unidades", valor: "32", descricao: "ativas", status: "🟢 Tudo certo" },
  { icone: "🚪", titulo: "Visitantes", valor: "12", descricao: "hoje", status: "🟡 2 aguardando" },
  { icone: "📦", titulo: "Entregas", valor: "4", descricao: "previstas", status: "🟡 1 pendente" },
  { icone: "📢", titulo: "Comunicados", valor: "3", descricao: "ativos", status: "🟢 Enviados" },
  { icone: "📅", titulo: "Assembleias", valor: "1", descricao: "agendada", status: "🟢 Confirmada" },
  { icone: "🛠", titulo: "Prestadores", valor: "2", descricao: "previstos", status: "🟡 Acompanhar" },
  { icone: "📄", titulo: "Contratos", valor: "2", descricao: "vencendo", status: "🟡 Revisar" },
  { icone: "💰", titulo: "Financeiro", valor: "R$", descricao: "resumo", status: "🔒 Futuro" },
  { icone: "⚙️", titulo: "Configurações", valor: "LAB", descricao: "ambiente", status: "🧪 Testes" },
  { icone: "🧠", titulo: "Central Inteligente", valor: "Ops", descricao: "segurança", status: "🚨 Especial", destaque: true },
  { icone: "➕", titulo: "Mais módulos", valor: "+", descricao: "roadmap", status: "💡 Ideias" },
];

export default function AcessoRapido() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-900">
          Módulos do condomínio
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Acesse as áreas principais e veja rapidamente o status de cada módulo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {modulos.map((item) => (
          <button
            key={item.titulo}
            className={`group min-h-[160px] rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              item.destaque
                ? "border-slate-800 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-950 hover:border-blue-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                  item.destaque ? "bg-white/10" : "bg-slate-100"
                }`}
              >
                {item.icone}
              </div>

              <span
                className={`text-lg font-black transition group-hover:translate-x-1 ${
                  item.destaque ? "text-white" : "text-blue-700"
                }`}
              >
                →
              </span>
            </div>

            <h3 className="mt-3 text-base font-black">{item.titulo}</h3>

            <div className="mt-1 flex items-end gap-1">
              <strong className="text-2xl font-black">{item.valor}</strong>

              <span
                className={`mb-1 text-xs font-semibold ${
                  item.destaque ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {item.descricao}
              </span>
            </div>

            <div
              className={`mt-3 rounded-2xl px-3 py-2 text-xs font-bold ${
                item.destaque
                  ? "bg-white/10 text-white"
                  : "bg-slate-50 text-slate-700"
              }`}
            >
              {item.status}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}