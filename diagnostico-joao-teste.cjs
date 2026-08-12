const {
  cert,
  initializeApp,
  getApps,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

function limpar(valor) {
  return String(valor || "")
    .trim()
    .replace(/^'+|'+$/g, "")
    .replace(/^"+|"+$/g, "");
}

async function executar() {
  const chave =
    JSON.parse(
      limpar(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      )
    );

  const app =
    getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert(chave),
          databaseURL:
            "https://qr-acesso-studio-default-rtdb.firebaseio.com",
        });

  const db =
    getDatabase(app);

  const snapshot =
    await db
      .ref("qrCentral/moradores")
      .get();

  if (!snapshot.exists()) {
    console.log("Nenhum morador operacional encontrado.");
    return;
  }

  const moradores =
    snapshot.val();

  const encontrados =
    Object.entries(moradores)
      .filter(([, morador]) => {
        const nome =
          String(
            morador?.nome || ""
          ).toLowerCase();

        return (
          nome.includes("joao") ||
          nome.includes("teste")
        );
      });

  console.log(
    "\n===== MORADORES OPERACIONAIS DE TESTE ====="
  );

  for (
    const [id, morador]
    of encontrados
  ) {
    console.log("\n--------------------------");
    console.log("ID:", id);
    console.dir(
      morador,
      {
        depth: null,
        colors: false,
      }
    );
  }

  console.log(
    "\n===== SOMENTE LEITURA ====="
  );
}

executar().catch(
  (erro) => {
    console.error(
      "\nERRO:",
      erro
    );
  }
);
