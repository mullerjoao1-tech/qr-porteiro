export type StatusAgendamento =
  | "aguardando"
  | "confirmado"
  | "em-atendimento"
  | "finalizado"
  | "cancelado"
  | "reagendado";

export type FiltroStatus = "todos" | StatusAgendamento;

export type Agendamento = {
  id: string;
  dataISO?: string;

  clienteId?: string;
  cliente: string;
  telefone: string;
  clienteNovo?: boolean;

  horario: string;
  servico: string;
  profissional: string;
  duracaoMinutos: number;
  valor: number;
  status: StatusAgendamento;

  observacoes?: string;
  criadoEm?: number;
  atualizadoEm?: number;
  origem?: "painel" | "cliente" | "whatsapp" | "qr-flow";

  filaEspera?: boolean;
  podeAntecipar?: boolean;
  atrasadoMinutos?: number;
  clienteCostumaAtrasar?: boolean;
  confirmadoAutomaticamente?: boolean;
  notificacaoEnviada?: boolean;
  prioridade?: "normal" | "alta" | "urgente";
  avatar?: string;
};

export type NovoAgendamento = Omit<
  Agendamento,
  "id" | "criadoEm" | "atualizadoEm"
>;
