const {
  cert,
  initializeApp,
  getApps,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

function limparAspas(valor) {
  return String(valor || "")
    .trim()
    .replace(/^'+|'+$/g, "")
    .replace(/^"+|"+$/g, "");
}

async function executar() {
  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chaveTexto) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY nao encontrada."
    );
  }

  const chave =
    JSON.parse(
      limparAspas(chaveTexto)
    );

  const app =
    getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert(chave),
          databaseURL:
            "https://qr-porteiro-app-default-rtdb.firebaseio.com",
        });

  const db =
    getDatabase(app);

  const uid =
    "3onYrlA6AmTMJgz5k1aOdzL2tLk2";

  const localId =
    "muller";

  const agora =
    Date.now();

  const permissoes = {
    receberChamadas: true,
    abrirPortao: true,
    visualizarCameras: true,
    controlarAlarme: true,
  };

  await db
    .ref()
    .update({
      [`usuarios-v2/${uid}/locais/${localId}/permissoes`]:
        permissoes,

      [`usuarios-v2/${uid}/locais/${localId}/atualizadoEm`]:
        agora,

      [`usuarios-v2/${uid}/condominios/${localId}/permissoes`]:
        permissoes,

      [`usuarios-v2/${uid}/condominios/${localId}/atualizadoEm`]:
        agora,

      [`usuarios-v2/${uid}/atualizadoEm`]:
        agora,
    });

  console.log(
    "PERMISSOES DO JOAO FELIPE RESTAURADAS."
  );
}

executar().catch(
  (erro) => {
    console.error(
      "\nERRO:",
      erro
    );

    process.exitCode = 1;
  }
);
