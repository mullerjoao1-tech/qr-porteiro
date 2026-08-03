"use client";

import { Hardware } from "../types/hardware";

interface StatusHardwareProps {
  status: Hardware["status"];
  tamanho?: "sm" | "md" | "lg";
}

const estilos = {
  online: {
    cor: "bg-green-500",
    texto: "Online",
  },
  offline: {
    cor: "bg-red-500",
    texto: "Offline",
  },
  alerta: {
    cor: "bg-yellow-500",
    texto: "Alerta",
  },
  configurando: {
    cor: "bg-blue-500",
    texto: "Configurando",
  },
  desconhecido: {
    cor: "bg-gray-400",
    texto: "Desconhecido",
  },
};

const tamanhos = {
  sm: {
    bolinha: "h-2 w-2",
    texto: "text-xs",
  },
  md: {
    bolinha: "h-3 w-3",
    texto: "text-sm",
  },
  lg: {
    bolinha: "h-4 w-4",
    texto: "text-base",
  },
};

export default function StatusHardware({
  status,
  tamanho = "md",
}: StatusHardwareProps) {
  const estilo = estilos[status];
  const size = tamanhos[tamanho];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${estilo.cor} ${size.bolinha} rounded-full`}
      />

      <span
        className={`font-medium ${size.texto}`}
      >
        {estilo.texto}
      </span>
    </div>
  );
}