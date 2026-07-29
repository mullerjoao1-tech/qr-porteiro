import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getAuth,
  type Auth,
} from "firebase-admin/auth";

import {
  getDatabase,
  type Database,
} from "firebase-admin/database";

import {
  getStorage,
  type Storage,
} from "firebase-admin/storage";

type FirebaseAdminServicos = {
  app: App;

  auth: Auth;

  database: Database;

  storage: Storage;
};

let servicosCache:
  | FirebaseAdminServicos
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

function obterStorageBucket(): string {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    "qr-acesso-studio.firebasestorage.app";

  if (!bucket.trim()) {
    throw new Error(
      "O bucket do Firebase Storage não foi informado."
    );
  }

  return bucket.trim();
}

export function obterFirebaseAdmin():
  FirebaseAdminServicos {
  if (servicosCache) {
    return servicosCache;
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert(
            obterChaveServico()
          ),

          databaseURL:
            "https://qr-acesso-studio-default-rtdb.firebaseio.com",

          storageBucket:
            obterStorageBucket(),
        });

  servicosCache = {
    app,

    auth:
      getAuth(app),

    database:
      getDatabase(app),

    storage:
      getStorage(app),
  };

  return servicosCache;
}
