import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

function iniciarFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: "https://qr-porteiro-app-default-rtdb.firebaseio.com",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mensagem: "Rota V2 funcionando",
  });
}

export async function POST(request: Request) {
  try {
    iniciarFirebaseAdmin();

    const db = getDatabase();
    const corpo = await request.json().catch(() => ({}));

    const unidadeId = corpo.unidadeId;

    if (!unidadeId) {
      return NextResponse.json(
        { ok: false, erro: "unidadeId não informado" },
        { status: 400 }
      );
    }

    const tokenSnapshot = await db
      .ref(`configuracoes-v2/tokensMorador/${unidadeId}`)
      .get();

    const token = tokenSnapshot.val();

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

    const resposta = await getMessaging().send({
      token,
      notification: {
        title: `🔔 ${nome} está chamando`,
        body: `Motivo: ${motivo}`,
      },
      data: {
        unidadeId: String(unidadeId),
        nome: String(nome),
        motivo: String(motivo),
        tipo: "chamada-v2",
      },
      webpush: {
        fcmOptions: {
          link: `https://qr-porteiro-dov7.vercel.app/morador-v2/${unidadeId}`,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Notificação V2 enviada",
      resposta,
    });
  } catch (erro: any) {
    console.error("ERRO PUSH V2:", erro);

    return NextResponse.json(
      {
        ok: false,
        mensagem: String(erro),
        detalhes: erro?.message || "sem detalhes",
      },
      { status: 500 }
    );
  }
}