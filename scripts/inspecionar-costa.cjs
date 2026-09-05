const { loadEnvConfig } = require("@next/env");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

loadEnvConfig(process.cwd());

const chave = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY
);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(chave),
    databaseURL: "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  });
}

async function main() {
  const db = getDatabase();

  const snap = await db
    .ref("locais-v2/residencial-costa")
    .get();

  if (!snap.exists()) {
    console.log("RESIDENCIAL COSTA NÃO ENCONTRADO EM locais-v2");
    return;
  }

  const dados = snap.val();

  console.log("\n=== RESIDENCIAL COSTA ===\n");

  console.log("Responsáveis:");
  console.log(
    JSON.stringify(dados.responsaveis || {}, null, 2)
  );

  console.log("\nUsuários:");
  console.log(
    JSON.stringify(dados.usuarios || {}, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error("ERRO:", erro);
    process.exit(1);
  });
