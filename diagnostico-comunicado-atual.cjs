const {
  cert,
  initializeApp,
  getApps,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

async function executar() {
  const chave =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  const serviceAccount =
    JSON.parse(chave);

  const app =
    getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert(serviceAccount),
          databaseURL:
            "https://qr-acesso-studio-default-rtdb.firebaseio.com",
        });

  const db =
    getDatabase(app);

  console.log(
    "\n===== CHAVES EM comunicados-v2 ====="
  );

  const comunicados =
    await db
      .ref("comunicados-v2")
      .get();

  console.log(
    comunicados.exists()
      ? Object.keys(
          comunicados.val()
        )
      : "VAZIO"
  );

  console.log(
    "\n===== comunicadoAtivo DO 1/11 ====="
  );

  const ativo =
    await db
      .ref(
        "unidades-v2/residencial-tulipas-bloco-1-ap-11/comunicadoAtivo"
      )
      .get();

  console.dir(
    ativo.exists()
      ? ativo.val()
      : "NAO ENCONTRADO",
    {
      depth: null,
    }
  );

  console.log(
    "\n===== comunicados-v2/residencial-tulipas ====="
  );

  const tulipas =
    await db
      .ref(
        "comunicados-v2/residencial-tulipas"
      )
      .get();

  console.dir(
    tulipas.exists()
      ? tulipas.val()
      : "NAO ENCONTRADO",
    {
      depth: 3,
    }
  );

  console.log(
    "\n===== FIM - SOMENTE LEITURA ====="
  );
}

executar().catch(
  console.error
);
