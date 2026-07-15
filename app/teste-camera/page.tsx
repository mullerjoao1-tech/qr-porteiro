"use client";

import { useState } from "react";

type CameraId = "yoosee" | "jortan";

type ResultadoCamera = {
  sucesso: boolean;
  camera?: CameraId;
  mensagem?: string;
  imagem?: string;
  atualizadoEm?: string;
  erro?: string;
};

type LogCamera = {
  id: string;
  horario: string;
  camera: string;
  mensagem: string;
  sucesso: boolean;
  duracaoMs: number;
};

const cameras = [
  {
    id: "yoosee" as const,
    nome: "Yoosee",
    local: "Portão principal",
    descricao: "Câmera Yoosee conectada por RTSP.",
  },
  {
    id: "jortan" as const,
    nome: "Jortan 3 em 1",
    local: "Área de teste",
    descricao: "Câmera Jortan com três imagens no mesmo stream.",
  },
];

export default function TesteCameraPage() {
  const [cameraSelecionada, setCameraSelecionada] =
    useState<CameraId>("yoosee");

  const [resultado, setResultado] =
    useState<ResultadoCamera | null>(null);

  const [imagem, setImagem] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(false);

  const [logs, setLogs] =
    useState<LogCamera[]>([]);

  async function testarSnapshot() {
    if (carregando) {
      return;
    }

    setCarregando(true);
    setResultado(null);

    const inicio = performance.now();

    try {
      const resposta = await fetch(
        `/api/capturar-camera?camera=${cameraSelecionada}&t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados =
        (await resposta.json()) as ResultadoCamera;

      const duracaoMs = Math.round(
        performance.now() - inicio
      );

      setResultado(dados);

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ||
            "Não foi possível capturar a imagem."
        );
      }

      if (!dados.imagem) {
        throw new Error(
          "A API não retornou o endereço da imagem."
        );
      }

      const imagemSemCache =
        `${dados.imagem}?t=${Date.now()}`;

      setImagem(imagemSemCache);

      setLogs((logsAtuais) => [
        {
          id: `${Date.now()}-${cameraSelecionada}`,
          horario:
            new Date().toLocaleTimeString("pt-BR"),
          camera: cameraSelecionada,
          mensagem:
            dados.mensagem ||
            "Snapshot capturado com sucesso.",
          sucesso: true,
          duracaoMs,
        },
        ...logsAtuais,
      ]);
    } catch (erro) {
      const duracaoMs = Math.round(
        performance.now() - inicio
      );

      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Erro inesperado ao testar a câmera.";

      setResultado({
        sucesso: false,
        camera: cameraSelecionada,
        erro: mensagem,
        atualizadoEm: new Date().toISOString(),
      });

      setLogs((logsAtuais) => [
        {
          id: `${Date.now()}-erro`,
          horario:
            new Date().toLocaleTimeString("pt-BR"),
          camera: cameraSelecionada,
          mensagem,
          sucesso: false,
          duracaoMs,
        },
        ...logsAtuais,
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function limparResultado() {
    setImagem(null);
    setResultado(null);
    setLogs([]);
  }

  const cameraAtual = cameras.find(
    (camera) => camera.id === cameraSelecionada
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08111f",
        color: "#ffffff",
        padding: "32px 16px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 950,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#22c55e",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          QR ACESSO STUDIO
        </p>

        <h1
          style={{
            margin: "8px 0",
            fontSize: 32,
          }}
        >
          📷 Laboratório de Câmeras
        </h1>

        <p
          style={{
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          Teste isolado de snapshots das câmeras antes
          da integração com os painéis.
        </p>

        <section
          style={{
            marginTop: 28,
            padding: 20,
            borderRadius: 16,
            border: "1px solid #2d3b55",
            background: "#182338",
          }}
        >
          <label
            htmlFor="camera"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Câmera para testar
          </label>

          <select
            id="camera"
            value={cameraSelecionada}
            disabled={carregando}
            onChange={(evento) => {
              setCameraSelecionada(
                evento.target.value as CameraId
              );
              setImagem(null);
              setResultado(null);
            }}
            style={{
              width: "100%",
              padding: 13,
              borderRadius: 10,
              border: "1px solid #475569",
              background: "#0c1729",
              color: "#ffffff",
              fontSize: 16,
            }}
          >
            {cameras.map((camera) => (
              <option
                key={camera.id}
                value={camera.id}
              >
                {camera.nome} — {camera.local}
              </option>
            ))}
          </select>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: "#0c1729",
            }}
          >
            <strong>
              {cameraAtual?.nome}
            </strong>

            <p
              style={{
                margin: "6px 0 0",
                color: "#cbd5e1",
                fontSize: 14,
              }}
            >
              {cameraAtual?.descricao}
            </p>
          </div>

          <button
            type="button"
            onClick={testarSnapshot}
            disabled={carregando}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "14px 18px",
              border: 0,
              borderRadius: 11,
              background: carregando
                ? "#64748b"
                : "#16a34a",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 16,
              cursor: carregando
                ? "not-allowed"
                : "pointer",
            }}
          >
            {carregando
              ? "Capturando imagem..."
              : "📸 Testar snapshot"}
          </button>
        </section>

        <section
          style={{
            marginTop: 22,
            padding: 20,
            borderRadius: 16,
            border: "1px solid #2d3b55",
            background: "#182338",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Resultado
          </h2>

          {imagem ? (
            <img
              src={imagem}
              alt={`Snapshot da câmera ${cameraAtual?.nome}`}
              style={{
                display: "block",
                width: "100%",
                maxHeight: 520,
                objectFit: "contain",
                borderRadius: 12,
                background: "#000000",
              }}
            />
          ) : (
            <div
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 220,
                padding: 20,
                borderRadius: 12,
                background: "#0b1220",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              Nenhuma imagem capturada neste teste.
            </div>
          )}

          <pre
            style={{
              marginTop: 16,
              padding: 15,
              borderRadius: 10,
              background: "#0b1220",
              color: resultado?.sucesso
                ? "#86efac"
                : "#7dd3fc",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {resultado
              ? JSON.stringify(
                  resultado,
                  null,
                  2
                )
              : "Nenhum resultado disponível."}
          </pre>
        </section>

        <section
          style={{
            marginTop: 22,
            padding: 20,
            borderRadius: 16,
            border: "1px solid #2d3b55",
            background: "#182338",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0 }}>
              📋 Logs
            </h2>

            <button
              type="button"
              onClick={limparResultado}
              disabled={
                logs.length === 0 &&
                !imagem &&
                !resultado
              }
              style={{
                padding: "9px 13px",
                border: 0,
                borderRadius: 9,
                background: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Limpar
            </button>
          </div>

          {logs.length === 0 ? (
            <p
              style={{
                color: "#94a3b8",
              }}
            >
              Nenhum teste registrado.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 16,
              }}
            >
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: 13,
                    borderRadius: 10,
                    background: "#0c1729",
                    borderLeft: `4px solid ${
                      log.sucesso
                        ? "#22c55e"
                        : "#ef4444"
                    }`,
                  }}
                >
                  <strong>
                    {log.horario} — {log.camera}
                  </strong>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#cbd5e1",
                    }}
                  >
                    {log.mensagem} — {log.duracaoMs} ms
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 12,
            background: "#3b2b0b",
            color: "#fde68a",
            lineHeight: 1.5,
          }}
        >
          Este teste somente captura uma fotografia. Ele
          não controla o portão, a sirene ou as luzes da
          câmera Jortan.
        </div>
      </section>
    </main>
  );
}