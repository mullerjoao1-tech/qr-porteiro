"use client";

import { useState } from "react";

import {
  executarAcesso,
  type ConfiguracaoMetodoAcesso,
  type MetodoAcesso,
  type ResultadoAcesso,
} from "../modules/access";

interface MetodoLaboratorio {
  metodo: MetodoAcesso;
  nome: string;
  icone: string;
  descricao: string;
  status: string;
  corStatus: string;
  prioridade: number;
  recursos: string[];
}

interface LogLaboratorio {
  id: string;
  horario: string;
  metodo: string;
  mensagem: string;
  sucesso: boolean;
}

const metodos: MetodoLaboratorio[] = [
  {
    metodo: "tuya",
    nome: "Tuya",
    icone: "☁️",
    descricao:
      "Abertura atual pela internet e pela nuvem Tuya.",
    status: "Estrutura pronta",
    corStatus: "#22c55e",
    prioridade: 1,
    recursos: [
      "Abrir acesso",
      "Consultar status",
      "Registrar logs",
    ],
  },
  {
    metodo: "ble",
    nome: "Bluetooth BLE",
    icone: "🔵",
    descricao:
      "Abertura local por proximidade, sem depender da internet.",
    status: "Em investigação",
    corStatus: "#facc15",
    prioridade: 2,
    recursos: [
      "Procurar dispositivo",
      "Conectar localmente",
      "Abrir sem internet",
    ],
  },
  {
    metodo: "nfc",
    nome: "NFC",
    icone: "📱",
    descricao:
      "Abertura local por celular, cartão, pulseira ou chaveiro.",
    status: "Aguardando implementação",
    corStatus: "#38bdf8",
    prioridade: 3,
    recursos: [
      "Ler identificação",
      "Validar permissão",
      "Registrar acesso",
    ],
  },
  {
    metodo: "esp32",
    nome: "ESP32",
    icone: "🔌",
    descricao:
      "Controlador local próprio para redundância e automação.",
    status: "Aguardando implementação",
    corStatus: "#94a3b8",
    prioridade: 4,
    recursos: [
      "Controle local",
      "Funcionamento offline",
      "Integração com sensores",
    ],
  },
];

export default function TesteAccessPage() {
  const [resultado, setResultado] =
    useState<ResultadoAcesso | null>(null);

  const [testando, setTestando] =
    useState<MetodoAcesso | null>(null);

  const [logs, setLogs] = useState<LogLaboratorio[]>([]);

  async function testarMetodo(
    metodoSelecionado: MetodoLaboratorio
  ) {
    setTestando(metodoSelecionado.metodo);

    const configuracao: ConfiguracaoMetodoAcesso = {
      id: metodoSelecionado.metodo,
      nome: metodoSelecionado.nome,
      metodo: metodoSelecionado.metodo,
      ativo: true,
      prioridade: metodoSelecionado.prioridade,
    };

    try {
      const resposta =
        await executarAcesso(configuracao);

      setResultado(resposta);

      const mensagem =
        resposta.mensagem ||
        resposta.erro ||
        "Teste finalizado.";

      const novoLog: LogLaboratorio = {
        id: `${Date.now()}-${metodoSelecionado.metodo}`,
        horario: new Date().toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ),
        metodo: metodoSelecionado.nome,
        mensagem,
        sucesso: resposta.sucesso,
      };

      setLogs((logsAtuais) => [
        novoLog,
        ...logsAtuais,
      ]);
    } catch (erro) {
      const mensagemErro =
        erro instanceof Error
          ? erro.message
          : "Erro inesperado durante o teste.";

      const respostaErro: ResultadoAcesso = {
        sucesso: false,
        metodo: metodoSelecionado.metodo,
        erro: mensagemErro,
        executadoEm: new Date().toISOString(),
      };

      setResultado(respostaErro);

      setLogs((logsAtuais) => [
        {
          id: `${Date.now()}-erro`,
          horario: new Date().toLocaleTimeString(
            "pt-BR"
          ),
          metodo: metodoSelecionado.nome,
          mensagem: mensagemErro,
          sucesso: false,
        },
        ...logsAtuais,
      ]);
    } finally {
      setTestando(null);
    }
  }

  function limparLogs() {
    setLogs([]);
    setResultado(null);
  }

  const quantidadePronta = metodos.filter(
    (item) => item.metodo === "tuya"
  ).length;

  const quantidadeDesenvolvimento =
    metodos.length - quantidadePronta;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #07111f 0%, #101b31 100%)",
        color: "#ffffff",
        padding: "30px 16px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 26,
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#22c55e",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            QR ACESSO STUDIO
          </p>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "clamp(28px, 5vw, 38px)",
            }}
          >
            🔐 Laboratório de Acesso
          </h1>

          <p
            style={{
              margin: 0,
              color: "#a9b5ca",
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            Ambiente isolado para testar métodos de
            acesso antes de qualquer integração com o
            Tulipas.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              background: "#17233a",
              border: "1px solid #2d3b55",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Métodos cadastrados
            </span>

            <strong
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 28,
              }}
            >
              {metodos.length}
            </strong>
          </div>

          <div
            style={{
              background: "#17233a",
              border: "1px solid #2d3b55",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Estrutura pronta
            </span>

            <strong
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 28,
                color: "#22c55e",
              }}
            >
              {quantidadePronta}
            </strong>
          </div>

          <div
            style={{
              background: "#17233a",
              border: "1px solid #2d3b55",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Em desenvolvimento
            </span>

            <strong
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 28,
                color: "#facc15",
              }}
            >
              {quantidadeDesenvolvimento}
            </strong>
          </div>

          <div
            style={{
              background: "#17233a",
              border: "1px solid #2d3b55",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Testes realizados
            </span>

            <strong
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 28,
                color: "#38bdf8",
              }}
            >
              {logs.length}
            </strong>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {metodos.map((item) => {
            const estaTestando =
              testando === item.metodo;

            return (
              <article
                key={item.metodo}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 350,
                  background: "#17233a",
                  border: "1px solid #2d3b55",
                  borderRadius: 18,
                  padding: 20,
                  boxShadow:
                    "0 12px 30px rgba(0,0,0,0.22)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 30,
                    }}
                  >
                    {item.icone}
                  </span>

                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                      }}
                    >
                      {item.nome}
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginTop: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background:
                            item.corStatus,
                          boxShadow: `0 0 10px ${item.corStatus}`,
                        }}
                      />

                      <span
                        style={{
                          color: item.corStatus,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    color: "#b9c4d6",
                    lineHeight: 1.45,
                    fontSize: 14,
                    minHeight: 62,
                  }}
                >
                  {item.descricao}
                </p>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "#0d182a",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                    }}
                  >
                    PRIORIDADE
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "#ffffff",
                    }}
                  >
                    {item.prioridade}
                  </strong>
                </div>

                <div
                  style={{
                    flex: 1,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    RECURSOS PREVISTOS
                  </span>

                  <div
                    style={{
                      display: "grid",
                      gap: 7,
                      marginTop: 9,
                    }}
                  >
                    {item.recursos.map((recurso) => (
                      <span
                        key={recurso}
                        style={{
                          color: "#cbd5e1",
                          fontSize: 13,
                        }}
                      >
                        ✓ {recurso}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={testando !== null}
                  onClick={() =>
                    testarMetodo(item)
                  }
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: 0,
                    borderRadius: 12,
                    background: estaTestando
                      ? "#64748b"
                      : "#16a34a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor:
                      testando !== null
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {estaTestando
                    ? "Executando..."
                    : "Executar teste"}
                </button>
              </article>
            );
          })}
        </section>

        <section
          style={{
            marginTop: 24,
            background: "#17233a",
            border: "1px solid #2d3b55",
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Resultado do último teste
          </h2>

          <pre
            style={{
              minHeight: 130,
              margin: 0,
              padding: 16,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              borderRadius: 12,
              background: "#091221",
              color: resultado?.sucesso
                ? "#86efac"
                : "#7dd3fc",
              lineHeight: 1.5,
            }}
          >
            {resultado
              ? JSON.stringify(
                  resultado,
                  null,
                  2
                )
              : "Nenhum teste realizado ainda."}
          </pre>
        </section>

        <section
          style={{
            marginTop: 24,
            background: "#17233a",
            border: "1px solid #2d3b55",
            borderRadius: 18,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              📋 Linha do tempo
            </h2>

            <button
              type="button"
              onClick={limparLogs}
              disabled={logs.length === 0}
              style={{
                padding: "9px 13px",
                border: 0,
                borderRadius: 9,
                background:
                  logs.length === 0
                    ? "#475569"
                    : "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                cursor:
                  logs.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Limpar
            </button>
          </div>

          {logs.length === 0 ? (
            <p
              style={{
                color: "#94a3b8",
                margin: 0,
              }}
            >
              Nenhuma atividade registrada.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "75px 130px 1fr",
                    gap: 12,
                    alignItems: "center",
                    padding: 13,
                    borderRadius: 12,
                    background: "#0c1729",
                    borderLeft: `4px solid ${
                      log.sucesso
                        ? "#22c55e"
                        : "#facc15"
                    }`,
                  }}
                >
                  <strong
                    style={{
                      color: "#7dd3fc",
                      fontSize: 13,
                    }}
                  >
                    {log.horario}
                  </strong>

                  <strong
                    style={{
                      color: "#ffffff",
                      fontSize: 14,
                    }}
                  >
                    {log.metodo}
                  </strong>

                  <span
                    style={{
                      color: "#cbd5e1",
                      fontSize: 14,
                    }}
                  >
                    {log.mensagem}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div
          style={{
            marginTop: 22,
            padding: 14,
            borderRadius: 12,
            background: "#3b2b0b",
            color: "#fde68a",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          ⚠️ Este laboratório ainda não envia
          comandos reais aos dispositivos e não abre
          o portão.
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 1000px) {
          section[style*="repeat(4"] {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }
        }

        @media (max-width: 620px) {
          section[style*="repeat(4"] {
            grid-template-columns: 1fr !important;
          }

          div[style*="75px 130px"] {
            grid-template-columns: 1fr !important;
            gap: 5px !important;
          }
        }
      `}</style>
    </main>
  );
}