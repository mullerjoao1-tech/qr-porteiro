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
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ?.trim();

  if (!chaveTexto) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada."
    );
  }

  let textoChave =
    chaveTexto;

  /*
   * No .env.local atual do Studio a credencial
   * pode vir envolvida por aspas simples.
   */
  if (
    textoChave.startsWith("'") &&
    textoChave.endsWith("'")
  ) {
    textoChave =
      textoChave.slice(
        1,
        -1
      );
  }

  let conteudoChave:
    unknown;

  try {
    conteudoChave =
      JSON.parse(
        textoChave
      );

    /*
     * Compatibilidade já usada anteriormente
     * no QR: JSON serializado como string.
     */
    if (
      typeof conteudoChave ===
      "string"
    ) {
      conteudoChave =
        JSON.parse(
          conteudoChave
        );
    }
  } catch {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY possui um JSON inválido."
    );
  }

  if (
    !conteudoChave ||
    typeof conteudoChave !==
      "object" ||
    Array.isArray(
      conteudoChave
    )
  ) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não possui o formato esperado."
    );
  }

  const dados =
    conteudoChave as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
    };

  const projectId =
    dados.project_id ||
    dados.projectId;

  const clientEmail =
    dados.client_email ||
    dados.clientEmail;

  const privateKey =
    dados.private_key ||
    dados.privateKey;

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "A conta de serviço não possui project_id, client_email ou private_key."
    );
  }

  return {
    projectId,
    clientEmail,

    privateKey:
      privateKey.replace(
        /\\n/g,
        "\n"
      ),
  };
}

function obterStorageBucket(): string {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    "QR Acesso.firebasestorage.app";

  if (!bucket.trim()) {
    throw new Error(
      "O bucket do Firebase Storage nÃ£o foi informado."
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
            "https://qr-porteiro-app-default-rtdb.firebaseio.com",

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

