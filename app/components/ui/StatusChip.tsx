"use client";

type Status =
  | "online"
  | "offline"
  | "ocupado"
  | "pendente"
  | "sucesso"
  | "erro"
  | "alerta"
  | "info";

type Props = {
  status: Status;
  texto?: string;
  pequeno?: boolean;
};

export default function StatusChip({
  status,
  texto,
  pequeno = false,
}: Props) {
  const estilos = {
    online: {
      cor: "bg-green-500/15 border-green-500/40 text-green-400",
      icone: "🟢",
      texto: "Online",
    },
    offline: {
      cor: "bg-red-500/15 border-red-500/40 text-red-400",
      icone: "🔴",
      texto: "Offline",
    },
    ocupado: {
      cor: "bg-orange-500/15 border-orange-500/40 text-orange-400",
      icone: "🟠",
      texto: "Em atendimento",
    },
    pendente: {
      cor: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
      icone: "🟡",
      texto: "Pendente",
    },
    sucesso: {
      cor: "bg-green-500/15 border-green-500/40 text-green-400",
      icone: "✅",
      texto: "Sucesso",
    },
    erro: {
      cor: "bg-red-500/15 border-red-500/40 text-red-400",
      icone: "❌",
      texto: "Erro",
    },
    alerta: {
      cor: "bg-amber-500/15 border-amber-500/40 text-amber-300",
      icone: "🚨",
      texto: "Alerta",
    },
    info: {
      cor: "bg-blue-500/15 border-blue-500/40 text-blue-300",
      icone: "ℹ️",
      texto: "Informação",
    },
  };

  const atual = estilos[status];

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full border
        ${pequeno ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}
        font-bold
        ${atual.cor}
      `}
    >
      <span>{atual.icone}</span>
      <span>{texto || atual.texto}</span>
    </div>
  );
}
