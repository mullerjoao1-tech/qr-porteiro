import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";

import {
  getDatabase,
  type Database,
} from "firebase-admin/database";

type FirebaseAdminQr = {
  app: App;
  database: Database;
};

const NOME_APP = "qr-materiais-admin";

let cache: FirebaseAdminQr | null = null;

function obterChaveServico(): ServiceAccount {
  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();

  if (!chaveTexto) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada."
    );
  }

  try {
    const chave = JSON.parse(
      chaveTexto
    ) as ServiceAccount;

    if (typeof chave.privateKey === "string") {
      chave.privateKey = chave.privateKey.replace(
        /\\n/g,
        "\n"
      );
    }

    if (
      !chave.projectId ||
      !chave.clientEmail ||
      !chave.privateKey
    ) {
      throw new Error(
        "O JSON da conta de serviço não possui projectId, clientEmail ou privateKey."
      );
    }

    return chave;
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "JSON inválido.";

    throw new Error(
      `A variável FIREBASE_SERVICE_ACCOUNT_KEY possui um JSON inválido: ${mensagem}`
    );
  }
}

function obterDatabaseUrl(): string {
  const databaseUrl =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() ||
    process.env.FIREBASE_DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "A URL do Realtime Database não foi encontrada."
    );
  }

  return databaseUrl.replace(/\/+$/g, "");
}

export function obterFirebaseAdminQr(): FirebaseAdminQr {
  if (cache) {
    return cache;
  }

  const existente = getApps().find(
    (appAtual) => appAtual.name === NOME_APP
  );

  const app =
    existente ??
    initializeApp(
      {
        credential: cert(
          obterChaveServico()
        ),
        databaseURL: obterDatabaseUrl(),
      },
      NOME_APP
    );

  cache = {
    app,
    database: getDatabase(app),
  };

  return cache;
}