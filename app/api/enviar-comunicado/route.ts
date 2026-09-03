import { NextResponse } from "next/server";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  ServiceAccount,
} from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import {
  FirebaseMessagingError,
  getMessaging,
} from "firebase-admin/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistroTokenMorador =
  | string
  | {
      token?: string;
      unidadeId?: string;
      condominioId?: string;
      atualizadoEm?: number;
    };

type CorpoComunicado = {
  tipo?: "comunicado-v2";
  unidadeId?: string;
  unidadesDestinatarias?: string[];
  condominioId?: string;
  comunicadoId?: string;
  titulo?: string;
  mensagem?: string;
  enviarPush?: boolean;
};

type DestinatarioPush = {
  unidadeId: string;
  condominioId: string;
  token: string;
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
      "Credenciais do Firebase Admin ausentes. Configure FIREBASE_SERVICE_ACCOUNT_KEY ou FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY."
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
      "https://qr-porteiro-app-default-rtdb.firebaseio.com",
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

function normalizarRegistroToken(
  unidadeIdChave: string,
  valor: RegistroTokenMorador
): DestinatarioPush {
  if (typeof valor === "string") {
    return {
      unidadeId: unidadeIdChave,
      condominioId: "",
      token: valor.trim(),
    };
  }

  return {
    unidadeId: String(valor?.unidadeId || unidadeIdChave).trim(),
    condominioId: String(valor?.condominioId || "").trim(),
    token: String(valor?.token || "").trim(),
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

function removerDuplicados(destinatarios: DestinatarioPush[]) {
  const tokensUsados = new Set<string>();

  return destinatarios.filter((destinatario) => {
    if (!destinatario.token || tokensUsados.has(destinatario.token)) {
      return false;
    }

    tokensUsados.add(destinatario.token);
    return true;
  });
}

export async function GET() {
  try {
    const app = iniciarFirebaseAdmin();

    return NextResponse.json({
      ok: true,
      mensagem: "Rota de comunicado V2 pronta",
      projetoFirebaseAdmin: app.options.projectId || "não identificado",
      databaseURL: app.options.databaseURL || "não identificada",
    });
  } catch (erro) {
    return NextResponse.json(
      {
        ok: false,
        erro: detalharErroPush(erro),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const corpo =
      (await request.json().catch(() => ({}))) as CorpoComunicado;

    const unidadeId = String(corpo.unidadeId || "").trim();
    const condominioId = String(corpo.condominioId || "").trim();
    const comunicadoId = String(corpo.comunicadoId || "").trim();
    const titulo = String(corpo.titulo || "").trim();
    const mensagem = String(corpo.mensagem || "").trim();

    const unidadesRecebidas = Array.isArray(corpo.unidadesDestinatarias)
      ? corpo.unidadesDestinatarias
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      : [];

    const unidadesSolicitadas = Array.from(
      new Set([unidadeId, ...unidadesRecebidas].filter(Boolean))
    );

    if (!titulo) {
      return NextResponse.json(
        { ok: false, erro: "titulo não informado" },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { ok: false, erro: "mensagem não informada" },
        { status: 400 }
      );
    }

    if (unidadesSolicitadas.length === 0 && !condominioId) {
      return NextResponse.json(
        {
          ok: false,
          erro:
            "Informe unidadeId, unidadesDestinatarias ou condominioId.",
        },
        { status: 400 }
      );
    }

    const app = iniciarFirebaseAdmin();
    const db = getDatabase(app);
    const messaging = getMessaging(app);
    const urlBase = obterUrlBase(request);

    const tokensSnapshot = await db
      .ref("configuracoes-v2/tokensMorador")
      .get();

    const tokensCadastrados =
      (tokensSnapshot.val() as Record<string, RegistroTokenMorador> | null) ||
      {};

    let destinatarios = Object.entries(tokensCadastrados)
      .map(([unidadeIdChave, valor]) =>
        normalizarRegistroToken(unidadeIdChave, valor)
      )
      .filter((registro) => Boolean(registro.token));

    if (unidadesSolicitadas.length > 0) {
      const unidadesPermitidas = new Set(unidadesSolicitadas);

      destinatarios = destinatarios.filter((registro) =>
        unidadesPermitidas.has(registro.unidadeId)
      );
    } else if (condominioId) {
      destinatarios = destinatarios.filter(
        (registro) => registro.condominioId === condominioId
      );
    }

    destinatarios = removerDuplicados(destinatarios);

    if (destinatarios.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          erro: "Nenhum token encontrado para os destinatários informados.",
          unidadesSolicitadas,
          condominioId,
          chavesDisponiveis: Object.keys(tokensCadastrados),
        },
        { status: 400 }
      );
    }

    const resultados: Array<{
      unidadeId: string;
      enviado: boolean;
      resposta?: string;
      erro?: {
        codigo: string;
        mensagem: string;
      };
    }> = [];

    for (const destinatario of destinatarios) {
      const { unidadeId: unidadeDestino, token } = destinatario;
      const link =
        `${urlBase}/dashboard/morador/comunicados` +
        `?local=${encodeURIComponent(condominioId)}` +
        `&unidade=${encodeURIComponent(unidadeDestino)}` +
        (comunicadoId
          ? `&comunicado=${encodeURIComponent(comunicadoId)}`
          : "");

      try {
        const resposta = await messaging.send({
          token,
          data: {
            tipo: "comunicado-v2",
            unidadeId: unidadeDestino,
            condominioId,
            comunicadoId,
            titulo: `📢 ${titulo}`,
            mensagem:
              mensagem.length > 120
                ? `${mensagem.slice(0, 117)}...`
                : mensagem,
            url: link,
          },
          webpush: {
            headers: {
              Urgency: "high",
              TTL: "86400",
            },
            fcmOptions: {
              link,
            },
          },
        });

        resultados.push({
          unidadeId: unidadeDestino,
          enviado: true,
          resposta,
        });

        if (condominioId && comunicadoId) {
          await db
            .ref(
              `comunicados-v2/${condominioId}/${comunicadoId}/enviosPush/${unidadeDestino}`
            )
            .set({
              unidadeId: unidadeDestino,
              enviado: true,
              enviadoEm: Date.now(),
              resposta,
            });
        }
      } catch (erro) {
        const detalhes = detalharErroPush(erro);

        resultados.push({
          unidadeId: unidadeDestino,
          enviado: false,
          erro: detalhes,
        });

        if (condominioId && comunicadoId) {
          await db
            .ref(
              `comunicados-v2/${condominioId}/${comunicadoId}/enviosPush/${unidadeDestino}`
            )
            .set({
              unidadeId: unidadeDestino,
              enviado: false,
              tentativaEm: Date.now(),
              erro: detalhes,
            });
        }
      }
    }

    const enviados = resultados.filter((item) => item.enviado).length;
    const falhas = resultados.length - enviados;

    if (condominioId && comunicadoId) {
      await db
        .ref(`comunicados-v2/${condominioId}/${comunicadoId}`)
        .update({
          pushProcessado: true,
          pushProcessadoEm: Date.now(),
          totalPushEnviados: enviados,
          totalPushFalhas: falhas,
          erroPush:
            enviados === 0
              ? "Não foi possível enviar o push para nenhum destinatário."
              : null,
        });
    }

    return NextResponse.json(
      {
        ok: enviados > 0,
        mensagem:
          enviados > 0
            ? "Push do comunicado processado."
            : "O push falhou para todos os destinatários.",
        totalDestinatarios: destinatarios.length,
        enviados,
        falhas,
        resultados,
      },
      { status: enviados > 0 ? 200 : 500 }
    );
  } catch (erro) {
    const detalhes = detalharErroPush(erro);

    console.error("ERRO PUSH COMUNICADO V2:", detalhes);

    return NextResponse.json(
      {
        ok: false,
        erro: detalhes.mensagem,
        detalhes,
      },
      { status: 500 }
    );
  }
}
