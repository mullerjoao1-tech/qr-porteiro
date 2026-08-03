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

type ChaveGoogle = {
  project_id?: string;
  client_email?: string;
  private_key?: string;

  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
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
    const chaveOriginal = JSON.parse(
      chaveTexto
    ) as ChaveGoogle;

    const projectId =
      chaveOriginal.project_id ||
      chaveOriginal.projectId;

    const clientEmail =
      chaveOriginal.client_email ||
      chaveOriginal.clientEmail;

    const privateKeyOriginal =
      chaveOriginal.private_key ||
      chaveOriginal.privateKey;

    const privateKey =
      typeof privateKeyOriginal === "string"
        ? privateKeyOriginal.replace(/\\n/g, "\n")
        : undefined;

    if (
      !projectId ||
      !clientEmail ||
      !privateKey
    ) {
      throw new Error(
        "O JSON da conta de serviço não possui project_id, client_email ou private_key."
      );
    }

    return {
      projectId,
      clientEmail,
      privateKey,
    };
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