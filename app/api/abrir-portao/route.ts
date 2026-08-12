import { TuyaContext } from "@tuya/tuya-connector-nodejs";

import {
  NextRequest,
} from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

import {
  registrarHistoricoLocal,
} from "@/app/services/server/historicoLocal";

export const runtime = "nodejs";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  try {

let contextoAcessoTemporario:
  | {
      localId: string;
      acessoId: string;
      atorUid: string;
      nome: string;
      tipo: string;
    }
  | null = null;

const localIdHistorico =
  request.nextUrl.searchParams
    .get("localId")
    ?.trim() || "";

const acessoIdHistorico =
  request.nextUrl.searchParams
    .get("acessoId")
    ?.trim() || "";

if (
  localIdHistorico ||
  acessoIdHistorico
) {
  if (
    !localIdHistorico ||
    !acessoIdHistorico
  ) {
    throw new Error(
      "Contexto do acesso temporario incompleto."
    );
  }

  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "Autenticacao necessaria para abrir o portao."
    );
  }

  const token =
    authorization
      .slice(7)
      .trim();

  const {
    auth,
    database,
  } =
    obterFirebaseAdmin();

  const usuario =
    await auth.verifyIdToken(
      token
    );

  const snapshot =
    await database
      .ref(
        `acessos-temporarios-v2/${localIdHistorico}/${acessoIdHistorico}`
      )
      .get();

  if (!snapshot.exists()) {
    throw new Error(
      "Acesso temporario nao encontrado."
    );
  }

  const acesso =
    snapshot.val();

  const agora =
    Date.now();

  const inicio =
    Number(
      acesso.inicio || 0
    );

  const fim =
    Number(
      acesso.fim || 0
    );

  if (acesso.ativo === false) {
    throw new Error(
      "Este acesso foi revogado."
    );
  }

  if (acesso.arquivado === true) {
    throw new Error(
      "Este acesso esta arquivado."
    );
  }

  if (
    acesso.permissoes?.abrirPortao !==
    true
  ) {
    throw new Error(
      "Este acesso nao possui permissao para abrir o portao."
    );
  }

  if (
    inicio &&
    agora < inicio
  ) {
    throw new Error(
      "Este acesso ainda nao esta no horario autorizado."
    );
  }

  if (
    fim &&
    agora > fim
  ) {
    throw new Error(
      "Este acesso temporario ja expirou."
    );
  }

  contextoAcessoTemporario = {
    localId:
      localIdHistorico,

    acessoId:
      acessoIdHistorico,

    atorUid:
      usuario.uid,

    nome:
      acesso.nome || "",

    tipo:
      acesso.tipo || "",
  };
}

    const accessId = process.env.TUYA_ACCESS_ID?.trim();
    const accessKey = process.env.TUYA_ACCESS_SECRET?.trim();
    const endpoint = process.env.TUYA_ENDPOINT?.trim().replace(/\/$/, "");
    const deviceId = process.env.TUYA_DEVICE_ID?.trim();
console.log("ENV ACCESS ID:", accessId);
console.log("ENV ENDPOINT:", endpoint);
console.log("ENV DEVICE ID:", deviceId);
    if (!accessId || !accessKey || !endpoint || !deviceId) {
      throw new Error("Variáveis Tuya ausentes no .env.local.");
    }

    const tuya = new TuyaContext({
      baseUrl: endpoint,
      accessKey: accessId,
      secretKey: accessKey,
    });

    console.log("ENVIANDO OFF PARA PREPARAR O PORTÃO...");

    const desligarAntes = await tuya.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [
          {
            code: "switch_1",
            value: false,
          },
        ],
      },
    });

    console.log("TUYA OFF:", desligarAntes);

    await esperar(700);

    console.log("ENVIANDO ON PARA ACIONAR O PORTÃO...");

    const acionar = await tuya.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [
          {
            code: "switch_1",
            value: true,
          },
        ],
      },
    });

    console.log("TUYA ON:", acionar);

if (
  desligarAntes.success === true &&
  acionar.success === true &&
  contextoAcessoTemporario
) {
  try {
    const {
      database,
    } =
      obterFirebaseAdmin();

    await registrarHistoricoLocal({
      database,

      localId:
        contextoAcessoTemporario.localId,

      tipoLocal:
        "residencia",

      modulo:
        "controle_acesso",

      acao:
        "portao_aberto_acesso_temporario",

      entidadeTipo:
        "acesso_temporario",

      entidadeId:
        contextoAcessoTemporario.acessoId,

      atorUid:
        contextoAcessoTemporario.atorUid,

      dados: {
        nome:
          contextoAcessoTemporario.nome,

        tipo:
          contextoAcessoTemporario.tipo,

        origem:
          "painel_residencia",

        metodo:
          "abertura_remota",
      },
    });
  } catch (erroHistorico) {
    console.error(
      "Erro ao registrar abertura no historico:",
      erroHistorico
    );
  }
}

if (!acionar.success) {
  console.log("ERRO DETALHADO ON:", JSON.stringify(acionar, null, 2));
}
    await esperar(1500);

    const status = await tuya.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/status`,
    });

    console.log("STATUS DEPOIS DO COMANDO:", status);

    return Response.json({
  success: desligarAntes.success === true && acionar.success === true,
  mensagem: "Comando OFF → ON enviado ao portão",
  desligarAntes,
  acionar,
  status,
});
  } catch (error) {
    console.error("ERRO TUYA SDK:", error);

    return Response.json(
      {
        success: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}