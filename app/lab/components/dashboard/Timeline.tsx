"use client";

const eventos = [
  {
    hora: "08:42",
    titulo: "Entrega registrada",
    descricao: "Mercado Livre chegou para a unidade 22.",
    tipo: "📦",
    cor: "bg-blue-500",
  },
  {
    hora: "08:18",
    titulo: "Visitante autorizado",
    descricao: "João da Silva entrou na unidade 31.",
    tipo: "🚪",
    cor: "bg-green-500",
  },
  {
    hora: "07:55",
    titulo: "Novo morador cadastrado",
    descricao: "Apartamento 14 atualizado.",
    tipo: "👥",
    cor: "bg-purple-500",
  },
  {
    hora: "07:20",
    titulo: "Comunicado enviado",
    descricao: "Aviso sobre limpeza da caixa d'água.",
    tipo: "📢",
    cor: "bg-orange-500",
  },
];

export default function Timeline() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">
          Atividade do condomínio
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Tudo que aconteceu hoje em ordem cronológica.
        </p>
      </div>

      <div className="space-y-5">
        {eventos.map((evento, index) => (
          <div
            key={index}
            className="flex items-start gap-4"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl text-white ${evento.cor}`}
              >
                {evento.tipo}
              </div>

              {index < eventos.length - 1 && (
                <div className="mt-2 h-10 w-1 rounded-full bg-slate-200" />
              )}
            </div>

            <div className="flex-1 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">
                  {evento.titulo}
                </h3>

                <span className="text-xs font-bold text-slate-500">
                  {evento.hora}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {evento.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}