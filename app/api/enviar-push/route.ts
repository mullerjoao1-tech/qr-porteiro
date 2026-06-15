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

export async function POST(request: Request) {
  try {
    iniciarFirebaseAdmin();

    const db = getDatabase();
    const corpo = await request.json().catch(() => ({}));
const canal = corpo.canal || "qr1";
const numero = canal.replace("qr", "");
const tokenNome = `tokenMorador${numero}`;
const painel = `painel${numero}`;
const snapshot = await db.ref(`configuracoes/${tokenNome}`).get();    
const token = snapshot.val();

    if (!token) {
      return NextResponse.json(
        { ok: false, erro: "Token do morador não encontrado" },
        { status: 400 }
      );
    }
const solicitacao = await db.ref(canal).get()
const dados = solicitacao.val();
const nome = dados?.nome || "Visitante";
const motivo = dados?.motivo || "Não informado";
  const resposta = await getMessaging().send({

  token,
  notification: {
    title: `🔔 ${nome} está chamando`,
    body: `Motivo: ${motivo}`,
  },
  webpush: {
  fcmOptions: {
    link: `https://qr-porteiro-dov7.vercel.app/${painel}`,
  },
},
});
console.log("FCM RESPOSTA:", resposta);


    return NextResponse.json({
  ok: true,
  mensagem: "Notificação enviada",
});
  } catch (erro: any) {
  console.error("ERRO COMPLETO:", erro);

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