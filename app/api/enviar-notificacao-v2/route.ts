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
};

type CorpoTeste = {
  tipo: "teste-push-v2";
  unidadeId: string;
};

type CorpoRequisicao = CorpoChamada | CorpoComunicado | CorpoTeste;

function iniciarFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const chaveServico = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    "https://qr-porteiro-app-default-rtdb.firebaseio.com";

  if (!chaveServico) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não está configurada."
    );
  }

  let serviceAccount: ServiceAccount;

  try {
    serviceAccount = JSON.parse(chaveServico) as ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY não contém um JSON válido."
    );
  }

  if (!serviceAccount.projectId) {
    throw new Error(
      "A conta de serviço não possui project_id/projectId."
    );
  }

  return initializeApp({
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

async function enviarPushIndividual({
  token,
  unidadeId,
  titulo,
  mensagem,
  link,
  tipo,
  condominioId = "",
  comunicadoId = "",
}: {
  token: string;
  unidadeId: string;
  titulo: string;
  mensagem: string;
  link: string;
  tipo: "chamada-v2" | "comunicado-v2" | "teste-push-v2";
  condominioId?: string;
  comunicadoId?: string;
}) {
  return getMessaging().send({
    token,
    notification: {
      title: titulo,
      body: mensagem,
    },
    data: {
      tipo,
      unidadeId: String(unidadeId),
      condominioId: String(condominioId),
      comunicadoId: String(comunicadoId),
    },
    webpush: {
      fcmOptions: {
        link,
      },
      headers: {
        Urgency: "high",
      },
    },
  });
}

export async function GET() {
  try {
    const app = iniciarFirebaseAdmin();

    return NextResponse.json({
      ok: true,
      mensagem: "Rota V2 funcionando para chamadas e comunicados",
      projetoFirebaseAdmin: app.options.projectId || "não identificado",
      databaseURL:
        app.options.databaseURL || "não identificada",
      appUrl:
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.VERCEL_URL ||
        "não configurada",
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
    const app = iniciarFirebaseAdmin();
    const db = getDatabase(app);
    const corpo = (await request.json().catch(() => ({}))) as CorpoRequisicao;
    const urlBase = obterUrlBase(request);

    // ======================================================
    // TESTE DIRETO DE UM ÚNICO TOKEN
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

      const token = tokenSnapshot.val();

      if (!token || typeof token !== "string") {
        return NextResponse.json(
          {
            ok: false,
            erro: `Token não encontrado para ${unidadeId}`,
          },
          { status: 400 }
        );
      }

      try {
        const resposta = await enviarPushIndividual({
          token,
          unidadeId,
          titulo: "🔔 Teste QR Acesso",
          mensagem: "O push do painel do morador está funcionando.",
          link: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
          tipo: "teste-push-v2",
        });

        return NextResponse.json({
          ok: true,
          mensagem: "Push de teste enviado",
          unidadeId,
          resposta,
          projetoFirebaseAdmin: app.options.projectId,
        });
      } catch (erro) {
        return NextResponse.json(
          {
            ok: false,
            unidadeId,
            projetoFirebaseAdmin: app.options.projectId,
            erro: detalharErroPush(erro),
          },
          { status: 500 }
        );
      }
    }

    // ======================================================
    // COMUNICADO PARA MORADORES DO CONDOMÍNIO
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
        (tokensSnapshot.val() as Record<string, unknown> | null) || {};

      const filtroCondominio = textoFiltroCondominio(condominioId);

      const destinatarios = Object.entries(tokensCadastrados).filter(
        ([unidadeId, token]) =>
          typeof token === "string" &&
          token.trim().length > 0 &&
          unidadeId.toLowerCase().includes(filtroCondominio)
      ) as Array<[string, string]>;

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

      const envios = await Promise.all(
        destinatarios.map(async ([unidadeId, token]) => {
          const link =
            `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}` +
            `?comunicado=${encodeURIComponent(comunicadoId)}`;

          try {
            const resposta = await enviarPushIndividual({
              token,
              unidadeId,
              titulo: `📢 ${titulo}`,
              mensagem:
                mensagem.length > 120
                  ? `${mensagem.slice(0, 117)}...`
                  : mensagem,
              link,
              tipo: "comunicado-v2",
              condominioId,
              comunicadoId,
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
              enviado: true,
              resposta,
            };
          } catch (erro) {
            const detalhesErro = detalharErroPush(erro);

            console.error(
              `ERRO PUSH PARA ${unidadeId}:`,
              detalhesErro
            );

            await db
              .ref(
                `comunicados-v2/${condominioId}/${comunicadoId}/enviosPush/${unidadeId}`
              )
              .set({
                unidadeId,
                enviado: false,
                tentativaEm: Date.now(),
                erro: detalhesErro,
              });

            return {
              unidadeId,
              enviado: false,
              erro: detalhesErro,
            };
          }
        })
      );

      const enviados = envios.filter((item) => item.enviado).length;
      const falhas = envios.length - enviados;

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
          projetoFirebaseAdmin: app.options.projectId,
          condominioId,
          filtroUtilizado: filtroCondominio,
          totalDestinatarios: destinatarios.length,
          enviados,
          falhas,
          resultados: envios,
        },
        { status: enviados > 0 ? 200 : 500 }
      );
    }

    // ======================================================
    // CHAMADA INDIVIDUAL V2
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

    const token = tokenSnapshot.val();

    if (!token || typeof token !== "string") {
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

    const resposta = await enviarPushIndividual({
      token,
      unidadeId,
      titulo: `🔔 ${nome} está chamando`,
      mensagem: `Motivo: ${motivo}`,
      link: `${urlBase}/morador-v2/${encodeURIComponent(unidadeId)}`,
      tipo: "chamada-v2",
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Notificação V2 enviada",
      resposta,
      projetoFirebaseAdmin: app.options.projectId,
    });
  } catch (erro) {
    console.error("ERRO GERAL PUSH V2:", erro);

    return NextResponse.json(
      {
        ok: false,
        erro: detalharErroPush(erro),
      },
      { status: 500 }
    );
  }
}
