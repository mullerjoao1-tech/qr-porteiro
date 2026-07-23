import { NextResponse } from "next/server";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  ServiceAccount,
} from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

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

type CorpoComunicadoTeste = {
  unidadeId?: string;
  comunicadoId?: string;
  titulo?: string;
  mensagem?: string;
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
    throw new Error("Credenciais do Firebase Admin ausentes.");
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

function normalizarToken(
  unidadeId: string,
  valor: RegistroTokenMorador | null
) {
  if (!valor) return "";

  if (typeof valor === "string") {
    return valor.trim();
  }

  return String(valor.token || "").trim();
}

export async function POST(request: Request) {
  try {
    const corpo =
      (await request.json().catch(() => ({}))) as CorpoComunicadoTeste;

    const unidadeId = corpo.unidadeId?.trim();
    const comunicadoId = corpo.comunicadoId?.trim();
    const titulo = corpo.titulo?.trim();
    const mensagem = corpo.mensagem?.trim();

    if (!unidadeId) {
      return NextResponse.json(
        { ok: false, erro: "unidadeId não informado" },
        { status: 400 }
      );
    }

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

    const app = iniciarFirebaseAdmin();
    const db = getDatabase(app);
    const messaging = getMessaging(app);

    const tokenSnapshot = await db
      .ref(`configuracoes-v2/tokensMorador/${unidadeId}`)
      .get();

    const registroToken = tokenSnapshot.val() as RegistroTokenMorador | null;
    const token = normalizarToken(unidadeId, registroToken);

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          erro: `Token não encontrado para ${unidadeId}`,
        },
        { status: 400 }
      );
    }

    const urlBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      new URL(request.url).origin;

    const resposta = await messaging.send({
      token,
      notification: {
        title: `📢 ${titulo}`,
        body:
          mensagem.length > 120
            ? `${mensagem.slice(0, 117)}...`
            : mensagem,
      },
      data: {
        tipo: "comunicado-teste",
        unidadeId,
        comunicadoId: comunicadoId || "",
      },
      webpush: {
        fcmOptions: {
          link:
            `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}` +
            (comunicadoId
              ? `?comunicado=${encodeURIComponent(comunicadoId)}`
              : ""),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Push de comunicado de teste enviado",
      unidadeId,
      resposta,
    });
  } catch (erro) {
    console.error("ERRO COMUNICADO TESTE:", erro);

    return NextResponse.json(
      {
        ok: false,
        erro: erro instanceof Error ? erro.message : String(erro),
      },
      { status: 500 }
    );
  }
}