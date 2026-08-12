const {
  cert,
  initializeApp,
  getApps,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function executar() {
  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chaveTexto) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY nao encontrada."
    );
  }

  const chaveLimpa =
    chaveTexto
      .trim()
      .replace(/^'+|'+$/g, "")
      .replace(/^"+|"+$/g, "");

  const chave =
    JSON.parse(chaveLimpa);

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
      .ref("usuarios-v2")
      .get();

  if (!snapshot.exists()) {
    console.log(
      "usuarios-v2 vazio."
    );

    return;
  }

  const usuarios =
    snapshot.val();

  const encontrados =
    Object.entries(usuarios)
      .filter(([, usuario]) => {
        const nome =
          normalizar(
            usuario?.nome
          );

        return (
          nome.includes("joao") ||
          nome.includes("fabiano") ||
          nome.includes("teste")
        );
      });

  console.log(
    "\n===== DIAGNOSTICO SOMENTE LEITURA ====="
  );

  for (
    const [uid, usuario]
    of encontrados
  ) {
    console.log(
      "\n----------------------------------------"
    );

    console.log(
      "NOME:",
      usuario?.nome || ""
    );

    console.log(
      "UID:",
      uid
    );

    console.log(
      "EMAIL:",
      usuario?.email || ""
    );

    console.log(
      "\nLOCAIS:"
    );

    console.dir(
      usuario?.locais || {},
      {
        depth: null,
        colors: false,
      }
    );

    console.log(
      "\nCONDOMINIOS:"
    );

    console.dir(
      usuario?.condominios || {},
      {
        depth: null,
        colors: false,
      }
    );
  }

  console.log(
    "\n===== FIM - NENHUM DADO ALTERADO ====="
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

