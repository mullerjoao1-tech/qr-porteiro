const { loadEnvConfig } = require("@next/env");

const {
  cert,
  getApps,
  initializeApp,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

loadEnvConfig(process.cwd());

function obterChaveServico() {
  const bruto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!bruto) {
    throw new Error(
      "Credencial Firebase Admin não encontrada no .env.local."
    );
  }

  try {
    return JSON.parse(bruto);
  } catch {
    const decodificado =
      Buffer.from(bruto, "base64").toString("utf8");

    return JSON.parse(decodificado);
  }
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(
      obterChaveServico()
    ),
    databaseURL:
      "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  });
}

async function main() {
  const database =
    getDatabase();

  const snapshot =
    await database
      .ref("usuarios-v2")
      .get();

  if (!snapshot.exists()) {
    console.log(
      "Nenhum usuário encontrado em usuarios-v2."
    );
    return;
  }

  const usuarios =
    snapshot.val();

  const encontrados = [];

  for (
    const [uid, dados]
    of Object.entries(usuarios)
  ) {
    const nome =
      String(dados?.nome || "");

    const email =
      String(dados?.email || "");

    const conteudo =
      `${nome} ${email}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    if (
      conteudo.includes("fabiano") ||
      conteudo.includes("muller") ||
      conteudo.includes("costa")
    ) {
      encontrados.push({
        uid,
        nome,
        email,
        status:
          dados?.status || "",
        primeiroAcesso:
          dados?.primeiroAcesso,
        precisaTrocarSenha:
          dados?.precisaTrocarSenha,
        locais:
          Object.keys(
            dados?.locais || {}
          ),
        condominios:
          Object.keys(
            dados?.condominios || {}
          ),
      });
    }
  }

  console.log(
    "\n=== USUÁRIOS ENCONTRADOS ===\n"
  );

  console.log(
    JSON.stringify(
      encontrados,
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error(
      "\nERRO:",
      erro
    );
    process.exit(1);
  });


