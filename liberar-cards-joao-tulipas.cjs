const {
  cert,
  initializeApp,
  getApps,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

async function executar() {
  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chaveTexto) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY nao encontrada."
    );
  }

  const serviceAccount =
    JSON.parse(
      String(chaveTexto).trim()
    );

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential:
            cert(serviceAccount),

          databaseURL:
            "https://qr-porteiro-app-default-rtdb.firebaseio.com",
        });

  const db =
    getDatabase(app);

  const uid =
    "zOsew1mVu4SkMsUcB1xO6rxs0bw1";

  const localId =
    "residencial-tulipas";

  const caminho =
    `usuarios-v2/${uid}/locais/${localId}/permissoes`;

  await db
    .ref(caminho)
    .update({
      receberChamadas:
        true,

      abrirPortao:
        true,
    });

  const snapshot =
    await db
      .ref(caminho)
      .get();

  console.log(
    "\n===== PERMISSOES ATUALIZADAS ====="
  );

  console.log(
    snapshot.val()
  );

  console.log(
    "\nSomente receberChamadas e abrirPortao foram atualizados."
  );
}

executar()
  .catch((erro) => {
    console.error(
      "\nERRO:",
      erro
    );

    process.exitCode = 1;
  });
