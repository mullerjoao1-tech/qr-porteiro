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

type ChaveServico = {
  project_id?: string;
  client_email?: string;
  private_key?: string;

  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
};

const NOME_APP_QR =
  "qr-materiais-producao";

const DATABASE_URL_PRODUCAO =
  "https://qr-porteiro-app-default-rtdb.firebaseio.com";

let cache: FirebaseAdminQr | null =
  null;

function obterChaveServico(): {
  credencial: ServiceAccount;
  projectId: string;
} {
  const chaveTexto =
    process.env
      .FIREBASE_SERVICE_ACCOUNT_KEY
      ?.trim();

  if (!chaveTexto) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada."
    );
  }

  try {
    const chave =
      JSON.parse(
        chaveTexto
      ) as ChaveServico;

    const projectId =
      chave.project_id ||
      chave.projectId;

    const clientEmail =
      chave.client_email ||
      chave.clientEmail;

    const privateKeyOriginal =
      chave.private_key ||
      chave.privateKey;

    const privateKey =
      typeof privateKeyOriginal ===
      "string"
        ? privateKeyOriginal.replace(
            /\\n/g,
            "\n"
          )
        : undefined;

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

      credencial: {
        projectId,
        clientEmail,
        privateKey,
      },
    };
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : String(erro);

    throw new Error(
      `A variável FIREBASE_SERVICE_ACCOUNT_KEY é inválida: ${mensagem}`
    );
  }
}

export function obterFirebaseAdminQr():
  FirebaseAdminQr {
  if (cache) {
    return cache;
  }

  const chave =
    obterChaveServico();

  const appExistente =
    getApps().find(
      (appAtual) =>
        appAtual.name ===
        NOME_APP_QR
    );

  const app =
    appExistente ??
    initializeApp(
      {
        credential:
          cert(
            chave.credencial
          ),

        projectId:
          chave.projectId,

        databaseURL:
          DATABASE_URL_PRODUCAO,
      },
      NOME_APP_QR
    );

  cache = {
    app,

    database:
      getDatabase(app),
  };

  return cache;
}