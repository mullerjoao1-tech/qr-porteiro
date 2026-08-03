"use client";

import CardHardware from "./CardHardware";
import { Hardware } from "../types/hardware";

interface ListaHardwareProps {
  hardwares: Hardware[];
  onTestar?: (id: string) => void;
  onEditar?: (id: string) => void;
}

export default function ListaHardware({
  hardwares,
  onTestar,
  onEditar,
}: ListaHardwareProps) {
  if (hardwares.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-700">
          Nenhum hardware cadastrado
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Cadastre câmeras, controladores, ESP32, dispositivos Tuya,
          leitores BLE, NFC e outros equipamentos para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {hardwares.map((hardware) => (
        <CardHardware
          key={hardware.id}
          hardware={hardware}
          onTestar={onTestar}
          onEditar={onEditar}
        />
      ))}
    </div>
  );
}