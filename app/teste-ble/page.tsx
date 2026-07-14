"use client";

declare global {
  interface Navigator {
    bluetooth: any;
  }
}

import { useState } from "react";

export default function TesteBLE() {
  const [status, setStatus] = useState("Pronto para testar.");

  async function procurarDispositivo() {
    if (!navigator.bluetooth) {
      alert("Este navegador não suporta Web Bluetooth.");
      return;
    }

    try {
      setStatus("Procurando dispositivos...");

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      });

      console.log(device);

      setStatus(
        `Dispositivo encontrado:\n\nNome: ${
          device.name || "(sem nome)"
        }\nID: ${device.id}`
      );

      alert(
        `Encontrado!\n\nNome: ${
          device.name || "(sem nome)"
        }\n\nID:\n${device.id}`
      );
    } catch (erro: any) {
      console.error(erro);

      setStatus(
        erro?.message || "Busca cancelada."
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 12,
          width: 420,
          boxShadow: "0 5px 20px rgba(0,0,0,.15)",
          textAlign: "center",
        }}
      >
        <h1>Teste Bluetooth</h1>

        <p
          style={{
            whiteSpace: "pre-wrap",
            marginTop: 20,
            marginBottom: 25,
          }}
        >
          {status}
        </p>

        <button
          onClick={procurarDispositivo}
          style={{
            padding: "15px 25px",
            fontSize: 18,
            cursor: "pointer",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
          }}
        >
          Procurar módulo BLE
        </button>
      </div>
    </main>
  );
}