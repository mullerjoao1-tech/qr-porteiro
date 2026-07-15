"use client";

import { Hardware } from "../types/hardware";

interface CardHardwareProps {
  hardware: Hardware;
  onTestar?: (id: string) => void;
  onEditar?: (id: string) => void;
}

const coresStatus: Record<Hardware["status"], string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  alerta: "bg-yellow-500",
  configurando: "bg-blue-500",
  desconhecido: "bg-gray-400",
};

export default function CardHardware({
  hardware,
  onTestar,
  onEditar,
}: CardHardwareProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">

      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-lg font-semibold">
            {hardware.nome}
          </h3>

          <p className="text-sm text-gray-500">
            {hardware.fabricante ?? "-"} • {hardware.modelo ?? "-"}
          </p>
        </div>

        <div
          className={`h-3 w-3 rounded-full ${
            coresStatus[hardware.status]
          }`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">

        <div>
          <span className="font-medium">Tipo</span>
          <br />
          {hardware.tipo}
        </div>

        <div>
          <span className="font-medium">Ambiente</span>
          <br />
          {hardware.ambiente}
        </div>

        <div>
          <span className="font-medium">IP</span>
          <br />
          {hardware.ip ?? "-"}
        </div>

        <div>
          <span className="font-medium">Status</span>
          <br />
          {hardware.status}
        </div>

      </div>

      <div className="mt-5 flex gap-2">

        <button
          onClick={() => onTestar?.(hardware.id)}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Testar
        </button>

        <button
          onClick={() => onEditar?.(hardware.id)}
          className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Editar
        </button>

      </div>
    </div>
  );
}