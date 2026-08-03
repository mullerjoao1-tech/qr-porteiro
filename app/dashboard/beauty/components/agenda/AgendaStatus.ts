import { StatusAgendamento } from "./AgendaTypes";

export const STATUS_AGENDAMENTO: Record<
  StatusAgendamento,
  {
    texto: string;
    icone: string;
    classes: string;
  }
> = {
  aguardando: {
    texto: "Aguardando confirmação",
    icone: "🟡",
    classes:
      "border-yellow-700 bg-yellow-950/40 text-yellow-300",
  },

  confirmado: {
    texto: "Confirmado",
    icone: "🟢",
    classes:
      "border-green-700 bg-green-950/40 text-green-300",
  },

  "em-atendimento": {
    texto: "Em atendimento",
    icone: "🔵",
    classes:
      "border-blue-700 bg-blue-950/40 text-blue-300",
  },

  finalizado: {
    texto: "Finalizado",
    icone: "⚫",
    classes:
      "border-slate-600 bg-slate-800 text-slate-300",
  },

  cancelado: {
    texto: "Cancelado",
    icone: "🔴",
    classes:
      "border-red-700 bg-red-950/40 text-red-300",
  },

  reagendado: {
    texto: "Reagendado",
    icone: "🟣",
    classes:
      "border-purple-700 bg-purple-950/40 text-purple-300",
  },
};

export function obterStatus(
  status: StatusAgendamento
) {
  return STATUS_AGENDAMENTO[status];
}