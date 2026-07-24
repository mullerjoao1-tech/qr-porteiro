"use client";

type EventoAgendaTimeline = {
  icone: string;
  titulo: string;
  detalhe: string;
};

type AgendaTimelineProps = {
  eventos?: EventoAgendaTimeline[];
};

const EVENTOS_PADRAO: EventoAgendaTimeline[] = [
  {
    icone: "✅",
    titulo: "Agendamento criado",
    detalhe: "Atendimento registrado na agenda.",
  },
  {
    icone: "📲",
    titulo: "Confirmação preparada",
    detalhe: "O envio automático será conectado ao QR Flow.",
  },
];

export default function AgendaTimeline({
  eventos = EVENTOS_PADRAO,
}: AgendaTimelineProps) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs font-black text-cyan-300">
        LINHA DO TEMPO
      </p>

      <div className="mt-4 space-y-3">
        {eventos.map((evento, indice) => (
          <div
            key={`${evento.titulo}-${indice}`}
            className="flex gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950">
              {evento.icone}
            </div>

            <div>
              <p className="text-sm font-black text-white">
                {evento.titulo}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {evento.detalhe}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
