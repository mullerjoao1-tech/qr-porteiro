import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

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
};

function iniciarFirebaseAdmin() {
  if (getApps().length > 0) return;

  const chaveServico = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    "https://qr-porteiro-app-default-rtdb.firebaseio.com";

  if (!chaveServico) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não está configurada."
    );
  }

  const serviceAccount = JSON.parse(chaveServico);

  initializeApp({
    credential: cert(serviceAccount),
    databaseURL,
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    mensagem: "Rota V2 funcionando para chamadas e comunicados",
  });
}

export async function POST(request: Request) {
  try {
    iniciarFirebaseAdmin();

    const db = getDatabase();
    const corpo = (await request.json().catch(() => ({}))) as
      | CorpoChamada
      | CorpoComunicado;

    const urlBase = obterUrlBase(request);

    // ======================================================
    // COMUNICADO PARA O CONDOMÍNIO
    // ======================================================

    if (corpo.tipo === "comunicado-v2") {
      const { condominioId, comunicadoId, titulo, mensagem } = corpo;

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
        (tokensSnapshot.val() as Record<string, string> | null) || {};

      const filtroCondominio = textoFiltroCondominio(condominioId);

      const destinatarios = Object.entries(tokensCadastrados).filter(
        ([unidadeId, token]) =>
          Boolean(token) &&
          unidadeId.toLowerCase().includes(filtroCondominio)
      );

      if (destinatarios.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            erro: "Nenhum token de morador encontrado para este condomínio",
          },
          { status: 400 }
        );
      }

      const resultados = await Promise.allSettled(
        destinatarios.map(async ([unidadeId, token]) => {
          const link =
            `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}` +
            `?comunicado=${encodeURIComponent(comunicadoId)}`;

          const resposta = await getMessaging().send({
            token,
            notification: {
              title: `📢 ${titulo}`,
              body:
                mensagem.length > 120
                  ? `${mensagem.slice(0, 117)}...`
                  : mensagem,
            },
            data: {
              tipo: "comunicado-v2",
              unidadeId: String(unidadeId),
              condominioId: String(condominioId),
              comunicadoId: String(comunicadoId),
              titulo: String(titulo),
            },
            webpush: {
              fcmOptions: {
                link,
              },
              notification: {
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-192x192.png",
                tag: `comunicado-${comunicadoId}`,
                requireInteraction: true,
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

          return {
            unidadeId,
            resposta,
          };
        })
      );

      const enviados = resultados.filter(
        (resultado) => resultado.status === "fulfilled"
      ).length;

      const falhas = resultados.length - enviados;

      await db
        .ref(`comunicados-v2/${condominioId}/${comunicadoId}`)
        .update({
          pushProcessado: true,
          pushProcessadoEm: Date.now(),
          totalPushEnviados: enviados,
          totalPushFalhas: falhas,
        });

      return NextResponse.json({
        ok: enviados > 0,
        mensagem: "Processamento do comunicado concluído",
        totalDestinatarios: destinatarios.length,
        enviados,
        falhas,
      });
    }

    // ======================================================
    // CHAMADA INDIVIDUAL — FLUXO ATUAL PRESERVADO
    // ======================================================

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
          link: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
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
