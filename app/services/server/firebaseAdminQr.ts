import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getDatabase,
  type Database,
} from "firebase-admin/database";

type FirebaseAdminQr = {
  app: App;
  database: Database;
};

let cache: FirebaseAdminQr | null = null;

function obterChaveServico() {
  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();

  if (!chaveTexto) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada."
    );
  }

  try {
    const chave = JSON.parse(chaveTexto);

    if (
      typeof chave.private_key === "string"
    ) {
      chave.private_key =
        chave.private_key.replace(
          /\\n/g,
          "\n"
        );
    }

    return chave;
  } catch {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY possui um JSON inválido."
    );
  }
}

function obterDatabaseUrl(): string {
  const url =
    process.env.FIREBASE_DATABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();

  if (!url) {
    throw new Error(
      "Nenhuma URL do Firebase Realtime Database foi configurada."
    );
  }

  return url.replace(/\/+$/g, "");
}

export function obterFirebaseAdminQr():
  FirebaseAdminQr {
  if (cache) {
    return cache;
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert(
            obterChaveServico()
          ),

          databaseURL:
            obterDatabaseUrl(),
        });

  cache = {
    app,
    database:
      getDatabase(app),
  };

  return cache;
}