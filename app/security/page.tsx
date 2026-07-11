"use client";

import { useState } from "react";

export default function Security() {
  const [energia, setEnergia] = useState("OK");
  const [alarme, setAlarme] = useState("Armado");

  const zonas = [
    { nome: "Porta 1", status: "fechada" },
    { nome: "Porta 2", status: "aberta" },
    { nome: "Garagem", status: "fechada" },
    { nome: "Corredor", status: "disparada" },
  ];

  const eventos = [
    "13:22 - Falha na rede elétrica",
    "13:36 - Porta 1 aberta",
    "13:40 - Corredor disparado",
  ];

  function corStatus(status: string) {
    if (status === "fechada") return "#22c55e";
    if (status === "aberta") return "#facc15";
    if (status === "disparada") return "#ef4444";
    return "#9ca3af";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        QR Security
      </h1>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2>Status Geral</h2>
        <p>Energia: {energia}</p>
        <p>Alarme: {alarme}</p>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2>Zonas</h2>

        {zonas.map((zona, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "8px",
              background: "#f9fafb",
            }}
          >
            <span>{zona.nome}</span>

            <span
              style={{
                color: "white",
                background: corStatus(zona.status),
                padding: "6px 12px",
                borderRadius: "8px",
              }}
            >
              {zona.status}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h2>Eventos Recentes</h2>

        {eventos.map((evento, index) => (
          <p key={index}>{evento}</p>
        ))}
      </div>
    </div>
  );
}