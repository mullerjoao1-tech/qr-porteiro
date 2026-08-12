import { NextResponse } from "next/server";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  ServiceAccount,
} from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { FirebaseMessagingError, getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CorpoChamada = {
  tipo?: "chamada-v2";
  unidadeId?: string;
};

type CorpoComunicado = {
  tipo: "comunicado-v2";
  condominioId: string;
  comunicadoId: string;
  titulo: string;
  mensagem: string;
  unidadesDestinatarias?: string[];
};

type CorpoTeste = {
  tipo: "teste-push-v2";
  unidadeId: string;
};

type CorpoRequisicao = CorpoChamada | CorpoComunicado | CorpoTeste;

type RegistroTokenMorador =
  | string
  | {
      token?: string;
      unidadeId?: string;
      condominioId?: string;
      atualizadoEm?: number;
    };


function iniciarFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const chaveServico = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();

  let projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (chaveServico) {
    let conteudoChave: unknown;

    try {
      conteudoChave = JSON.parse(chaveServico);

      if (typeof conteudoChave === "string") {
        conteudoChave = JSON.parse(conteudoChave);
      }
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY existe, mas não contém um JSON válido."
      );
    }

    if (
      !conteudoChave ||
      typeof conteudoChave !== "object" ||
      Array.isArray(conteudoChave)
    ) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY não possui o formato esperado."
      );
    }

    const dados = conteudoChave as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
    };

    projectId = dados.project_id || dados.projectId || projectId;
    clientEmail = dados.client_email || dados.clientEmail || clientEmail;
    privateKey = dados.private_key || dados.privateKey || privateKey;
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Credenciais do Firebase Admin ausentes. Configure FIREBASE_SERVICE_ACCOUNT_KEY ou FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no arquivo .env.local do Studio."
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL:
  process.env.FIREBASE_DATABASE_URL?.trim() ||
  "https://qr-acesso-studio-default-rtdb.firebaseio.com",
  });
}

function obterUrlBase(request: Request) {
  const urlConfigurada = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (urlConfigurada) {
    return urlConfigurada.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return new URL(request.url).origin;
}

function textoFiltroCondominio(condominioId: string) {
  const normalizado = condominioId.toLowerCase();

  if (normalizado.includes("tulipas")) return "tulipas";
  if (normalizado.includes("flores")) return "flores";
  if (normalizado.includes("alfa")) return "alfa";

  return normalizado.replace(/^cnd-/, "");
}

function normalizarRegistroToken(
  unidadeIdChave: string,
  valor: RegistroTokenMorador
) {
  if (typeof valor === "string") {
    return {
      unidadeId: unidadeIdChave,
      condominioId: "",
      token: valor.trim(),
      formatoAntigo: true,
    };
  }

  return {
    unidadeId: String(valor?.unidadeId || unidadeIdChave),
    condominioId: String(valor?.condominioId || ""),
    token: String(valor?.token || "").trim(),
    formatoAntigo: false,
  };
}

function detalharErroPush(erro: unknown) {
  const erroFirebase = erro as FirebaseMessagingError & {
    code?: string;
    message?: string;
    errorInfo?: {
      code?: string;
      message?: string;
    };
  };

  return {
    codigo:
      erroFirebase?.errorInfo?.code ||
      erroFirebase?.code ||
      "erro-desconhecido",
    mensagem:
      erroFirebase?.errorInfo?.message ||
      erroFirebase?.message ||
      String(erro),
  };
}

export async function GET() {
  try {
    const app = iniciarFirebaseAdmin();

    return NextResponse.json({
      ok: true,
      mensagem: "Rota V2 pronta para chamadas e comunicados",
      projetoFirebaseAdmin: app.options.projectId || "não identificado",
      databaseURL: app.options.databaseURL || "não identificada",
    });
  } catch (erro) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: detalharErroPush(erro).mensagem,
        erro: detalharErroPush(erro),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const app = iniciarFirebaseAdmin();
    const db = getDatabase(app);
    const messaging = getMessaging(app);
    const corpo = (await request.json().catch(() => ({}))) as CorpoRequisicao;
    const urlBase = obterUrlBase(request);

    // ======================================================
    // TESTE DIRETO DE UM ÚNICO MORADOR
    // ======================================================

    if (corpo.tipo === "teste-push-v2") {
      const unidadeId = corpo.unidadeId?.trim();

      if (!unidadeId) {
        return NextResponse.json(
          { ok: false, erro: "unidadeId não informado" },
          { status: 400 }
        );
      }

      const tokenSnapshot = await db
        .ref(`configuracoes-v2/tokensMorador/${unidadeId}`)
        .get();

      const registroToken = tokenSnapshot.val() as RegistroTokenMorador | null;
      const tokenNormalizado = registroToken
        ? normalizarRegistroToken(unidadeId, registroToken)
        : null;
      const token = tokenNormalizado?.token || "";

      if (!token) {
        return NextResponse.json(
          {
            ok: false,
            erro: `Token não encontrado para ${unidadeId}`,
          },
          { status: 400 }
        );
      }

      const resposta = await messaging.send({
        token,
        
        data: {
  tipo: "teste-push-v2",
  unidadeId: String(unidadeId),
  titulo: "🔔 Teste QR Acesso",
  mensagem: "O push do painel do morador está funcionando.",
  url: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
},
        webpush: {
          headers: {
            Urgency: "high",
            TTL: "86400",
          },
          fcmOptions: {
            link: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        mensagem: "Push de teste enviado",
        unidadeId,
        resposta,
      });
    }

    // ======================================================
    // COMUNICADO PARA MORADORES DO CONDOMÍNIO
    // ======================================================

    if (corpo.tipo === "comunicado-v2") {
      const {
        condominioId,
        comunicadoId,
        titulo,
        mensagem,
        unidadesDestinatarias,
      } = corpo;

      if (!condominioId || !comunicadoId || !titulo || !mensagem) {
        return NextResponse.json(
          {
            ok: false,
            erro:
              "condominioId, comunicadoId, titulo e mensagem são obrigatórios",
          },
          { status: 400 }
        );
      }

      const tokensSnapshot = await db
        .ref("configuracoes-v2/tokensMorador")
        .get();

      const tokensCadastrados =
        (tokensSnapshot.val() as Record<string, RegistroTokenMorador> | null) ||
        {};

      const filtroCondominio = textoFiltroCondominio(condominioId);

      const unidadesPermitidas = Array.isArray(unidadesDestinatarias)
        ? new Set(
            unidadesDestinatarias
              .map((unidadeId) => String(unidadeId || "").trim())
              .filter(Boolean)
          )
        : null;

      const destinatarios = Object.entries(tokensCadastrados)
        .map(([unidadeIdChave, valor]) =>
          normalizarRegistroToken(unidadeIdChave, valor)
        )
        .filter((registro) => {
          if (!registro.token) return false;

          const pertenceAoCondominio = registro.condominioId
            ? registro.condominioId === condominioId
            : registro.unidadeId
                .toLowerCase()
                .includes(filtroCondominio);

          if (!pertenceAoCondominio) return false;

          if (unidadesPermitidas && unidadesPermitidas.size > 0) {
            return unidadesPermitidas.has(registro.unidadeId);
          }

          return true;
        });

      if (destinatarios.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            erro: "Nenhum token de morador encontrado para este condomínio",
            condominioId,
            filtroUtilizado: filtroCondominio,
            chavesEncontradas: Object.keys(tokensCadastrados),
          },
          { status: 400 }
        );
      }

      const resultados = [];

      for (const destinatario of destinatarios) {
        const { unidadeId, token } = destinatario;
        try {
          const resposta = await messaging.send({
            token,
            
           data: {
  tipo: "comunicado-v2",
  unidadeId: String(unidadeId),
  condominioId: String(condominioId),
  comunicadoId: String(comunicadoId),
  titulo: `📢 ${titulo}`,
  mensagem:
    mensagem.length > 120
      ? `${mensagem.slice(0, 117)}...`
      : mensagem,
  url:
    `${urlBase}/dashboard/morador/comunicados` +
                  `?local=${encodeURIComponent(condominioId)}` +
                  `&unidade=${encodeURIComponent(unidadeId)}` +
                  `&comunicado=${encodeURIComponent(comunicadoId)}`,
},
            webpush: {
          headers: {
            Urgency: "high",
            TTL: "86400",
          },
          fcmOptions: {
                link:
                  `${urlBase}/dashboard/morador/comunicados` +
                  `?local=${encodeURIComponent(condominioId)}` +
                  `&unidade=${encodeURIComponent(unidadeId)}` +
                  `&comunicado=${encodeURIComponent(comunicadoId)}`,
              },
            },
          });

          await db
            .ref(
              `comunicados-v2/${condominioId}/${comunicadoId}/enviosPush/${unidadeId}`
            )
            .set({
              unidadeId,
              enviado: true,
              enviadoEm: Date.now(),
              resposta,
            });

          resultados.push({
            unidadeId,
            enviado: true,
            resposta,
          });
        } catch (erro) {
          const detalhes = detalharErroPush(erro);

          await db
            .ref(
              `comunicados-v2/${condominioId}/${comunicadoId}/enviosPush/${unidadeId}`
            )
            .set({
              unidadeId,
              enviado: false,
              tentativaEm: Date.now(),
              erro: detalhes,
            });

          resultados.push({
            unidadeId,
            enviado: false,
            erro: detalhes,
          });
        }
      }

      const enviados = resultados.filter((item) => item.enviado).length;
      const falhas = resultados.length - enviados;

      await db
        .ref(`comunicados-v2/${condominioId}/${comunicadoId}`)
        .update({
          pushProcessado: true,
          pushProcessadoEm: Date.now(),
          totalPushEnviados: enviados,
          totalPushFalhas: falhas,
        });

      return NextResponse.json(
        {
          ok: enviados > 0,
          mensagem: "Processamento do comunicado concluído",
          totalDestinatarios: destinatarios.length,
          enviados,
          falhas,
          resultados,
        },
        { status: enviados > 0 ? 200 : 500 }
      );
    }

    // ======================================================
    // CHAMADA INDIVIDUAL V2 — MESMA BASE DO TULIPAS
    // ======================================================

    const unidadeId = corpo.unidadeId?.trim();

    if (!unidadeId) {
      return NextResponse.json(
        { ok: false, erro: "unidadeId não informado" },
        { status: 400 }
      );
    }

    const tokenSnapshot = await db
      .ref(`configuracoes-v2/tokensMorador/${unidadeId}`)
      .get();

    const registroToken = tokenSnapshot.val() as RegistroTokenMorador | null;
    const tokenNormalizado = registroToken
      ? normalizarRegistroToken(unidadeId, registroToken)
      : null;
    const token = tokenNormalizado?.token || "";

    if (!token) {
      return NextResponse.json(
        { ok: false, erro: "Token do morador V2 não encontrado" },
        { status: 400 }
      );
    }

    const chamadaSnapshot = await db
      .ref(`unidades-v2/${unidadeId}/chamada`)
      .get();

    const chamada = chamadaSnapshot.val();

    const nome = chamada?.nome || "Visitante";
    const motivo = chamada?.motivo || "Não informado";

    const resposta = await messaging.send({
      token,
     data: {
  unidadeId: String(unidadeId),
  nome: String(nome),
  motivo: String(motivo),
  tipo: "chamada-v2",
  titulo: `🔔 ${nome} está chamando`,
  mensagem: `Motivo: ${motivo}`,
  url: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
},
      webpush: {
          headers: {
            Urgency: "high",
            TTL: "86400",
          },
          fcmOptions: {
          link: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Notificação V2 enviada",
      resposta,
    });
  } catch (erro) {
    console.error("ERRO PUSH V2:", erro);

    return NextResponse.json(
      {
        ok: false,
        mensagem: detalharErroPush(erro).mensagem,
        erro: detalharErroPush(erro),
      },
      { status: 500 }
    );
  }
}
