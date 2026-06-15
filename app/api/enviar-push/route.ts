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
    mensagem: "Rota funcionando",
  });
}

export async function POST() {
  try {
    iniciarFirebaseAdmin();

    const db = getDatabase();
const snapshot = await db.ref("configuracoes/tokenMorador2").get();    
const token = snapshot.val();

    if (!token) {
      return NextResponse.json(
        { ok: false, erro: "Token do morador não encontrado" },
        { status: 400 }
      );
    }
const solicitacao = await db.ref("qr2").get();
const dados = solicitacao.val();
const nome = dados?.nome || "Visitante";
const motivo = dados?.motivo || "Não informado";
    await getMessaging().send({
      token,
  notification: {
  title: `🔔 ${nome} está chamando`,
  body: `Motivo: ${motivo}`,
},
      webpush: {
        fcmOptions: {
link: "https://qr-porteiro-dov7.vercel.app/painel1",        },
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Notificação enviada",
    });
  } catch (erro) {
    console.error("Erro ao enviar push:", erro);

    return NextResponse.json(
      { ok: false, erro: "Erro ao enviar push" },
      { status: 500 }
    );
  }
}