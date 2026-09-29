const {
  cert,
  initializeApp,
  getApps,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

function limparChave(valor) {
  let texto =
    String(valor || "")
      .trim();

  if (
    texto.startsWith("'") &&
    texto.endsWith("'")
  ) {
    texto =
      texto.slice(
        1,
        -1
      );
  }

  return texto;
}

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
      limparChave(
        chaveTexto
      )
    );

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential:
            cert(
              serviceAccount
            ),

          databaseURL:
            "https://qr-acesso-studio-default-rtdb.firebaseio.com",
        });

  const db =
    getDatabase(app);

  const uid =
    "zOsew1mVu4SkMsUcB1xO6rxs0bw1";

  const email =
    "mullerjoao1@gmail.com";

  const unidadeId =
    "residencial-tulipas-bloco-1-ap-11";

  const moradoresRef =
    db.ref(
      "qrCentral/moradores"
    );

  const snapshot =
    await moradoresRef.get();

  let moradorExistente =
    null;

  if (snapshot.exists()) {
    snapshot.forEach(
      (filho) => {
        const dados =
          filho.val() || {};

        if (
          dados.usuarioUid === uid ||
          dados.uid === uid ||
          String(
            dados.email || ""
          )
            .trim()
            .toLowerCase() ===
            email
        ) {
          moradorExistente = {
            id:
              filho.key,

            dados,
          };
        }
      }
    );
  }

  if (moradorExistente) {
    console.log(
      "\nJOAO JA EXISTE COMO MORADOR OPERACIONAL."
    );

    console.log(
      "ID:",
      moradorExistente.id
    );

    console.dir(
      moradorExistente.dados,
      {
        depth: null,
        colors: false,
      }
    );

    console.log(
      "\nNENHUM DADO FOI ALTERADO."
    );

    return;
  }

  const agora =
    Date.now();

  const novoRef =
    moradoresRef.push();

  const morador = {
    codigo:
      "MOR-JOAO-TESTE",

    nome:
      "João Muller",

    email,

    usuarioUid:
      uid,

    unidadeId,

    unidadeNome:
      "Residencial Tulipas - Bloco 1 - 11",

    status:
      "ativo",

    ativo:
      true,

    disponivel:
      true,

    recebeChamadas:
      true,

    podeAbrirPortao:
      true,

    encaminhamentoAutomatico:
      true,

    prioridade:
      1,

    ordemAtendimento:
      1,

    criadoEm:
      new Date()
        .toISOString(),

    atualizadoEm:
      agora,

    ultimoStatusEm:
      agora,
  };

  await novoRef.set(
    morador
  );

  console.log(
    "\n===== JOAO CADASTRADO NO TULIPAS ====="
  );

  console.log(
    "ID:",
    novoRef.key
  );

  console.log(
    "UID universal:",
    uid
  );

  console.log(
    "Unidade:",
    unidadeId
  );

  console.log(
    "\nFabiano NAO foi alterado."
  );

  console.log(
    "Residencia Muller NAO foi alterada."
  );
}

executar()
  .catch(
    (erro) => {
      console.error(
        "\nERRO:",
        erro
      );

      process.exitCode = 1;
    }
  );
