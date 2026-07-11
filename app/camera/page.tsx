"use client";

export default function CameraTeste() {
  const cameraUrl = "rtsp://192.168.15.13:554/onvif1";

  function abrirCamera() {
    window.location.href = cameraUrl;
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#0f172a", borderRadius: "20px", padding: "28px", textAlign: "center" }}>
        <h1>📹 Câmera do Portão</h1>

        <p style={{ color: "#4ade80", fontWeight: "bold" }}>
          ✅ Câmera RTSP encontrada
        </p>

        <p style={{ wordBreak: "break-all" }}>{cameraUrl}</p>

        <button onClick={abrirCamera} style={{ width: "100%", background: "#9333ea", color: "white", fontWeight: "bold", padding: "14px", borderRadius: "14px", border: "none", cursor: "pointer" }}>
          📹 Abrir câmera no VLC
        </button>

        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "20px" }}>
          Próxima etapa: converter RTSP para vídeo dentro do painel QR Acesso.
        </p>
      </div>
    </main>
  );
}
