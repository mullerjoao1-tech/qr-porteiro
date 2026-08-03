"use client";

import { useEffect, useState } from "react";

import ListaHardware from "./components/ListaHardware";
import { hardwareService } from "./services/hardwareService";
import { Hardware } from "./types/hardware";

export default function HardwarePage() {
  const [hardwares, setHardwares] = useState<Hardware[]>([]);

  useEffect(() => {
    if (hardwareService.listar().length === 0) {
      hardwareService.criar({
        nome: "Jortan ICSEE",
        tipo: "camera",
        fabricante: "Jortan",
        modelo: "ICSEE",
        ambiente: "studio",
        homologado: true,
        ip: "192.168.0.100",
        protocolos: ["rtsp", "http"],
      });

      hardwareService.criar({
        nome: "Yoosee",
        tipo: "camera",
        fabricante: "Yoosee",
        modelo: "Wi-Fi",
        ambiente: "studio",
        homologado: false,
        ip: "Aguardando",
        protocolos: ["rtsp"],
      });

      hardwareService.criar({
        nome: "Access Tuya",
        tipo: "controle-acesso",
        fabricante: "Tuya",
        modelo: "BLE",
        ambiente: "studio",
        homologado: false,
        protocolos: ["tuya", "ble"],
      });

      hardwareService.criar({
        nome: "ESP32 Lab",
        tipo: "esp32",
        fabricante: "Espressif",
        modelo: "ESP32",
        ambiente: "studio",
        homologado: false,
        protocolos: ["wifi"],
      });
    }

    setHardwares(hardwareService.listar());
  }, []);

  function atualizarLista() {
    setHardwares([...hardwareService.listar()]);
  }

  async function testar(id: string) {
    await hardwareService.testar(id);
    atualizarLista();
  }

  function editar(id: string) {
    alert(`Editar hardware: ${id}`);
  }

  const online = hardwares.filter((h) => h.status === "online").length;
  const offline = hardwares.filter((h) => h.status === "offline").length;
  const homologados = hardwares.filter((h) => h.homologado).length;

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-7xl">

        <h1 className="text-3xl font-bold">
          Hardware Manager
        </h1>

        <p className="mt-2 text-gray-600">
          Central de gerenciamento de dispositivos do QR Acesso Studio.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-gray-500">
              Total
            </div>

            <div className="mt-2 text-3xl font-bold">
              {hardwares.length}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-gray-500">
              Online
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {online}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-gray-500">
              Offline
            </div>

            <div className="mt-2 text-3xl font-bold text-red-600">
              {offline}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-gray-500">
              Homologados
            </div>

            <div className="mt-2 text-3xl font-bold text-blue-600">
              {homologados}
            </div>
          </div>

        </div>

        <div className="mt-8">

          <ListaHardware
            hardwares={hardwares}
            onTestar={testar}
            onEditar={editar}
          />

        </div>

      </div>

    </main>
  );
}