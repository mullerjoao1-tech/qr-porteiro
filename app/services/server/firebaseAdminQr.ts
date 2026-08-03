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

let cache:
  | FirebaseAdminQr
  | null = null;

function obterChaveServico() {
  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chaveTexto) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada."
    );
  }

  try {
    return JSON.parse(
      chaveTexto
    );
  } catch {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY possui um JSON inválido."
    );
  }
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
          credential:
            cert(
              obterChaveServico()
            ),

          databaseURL:
            "https://qr-acesso-studio-default-rtdb.firebaseio.com",
        });

  cache = {
    app,

    database:
      getDatabase(app),
  };

  return cache;
}