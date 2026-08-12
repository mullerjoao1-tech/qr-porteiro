const fs = require("fs");

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
            "https://qr-acesso-studio-default-rtdb.firebaseio.com",
        });

  const db =
    getDatabase(app);

  const uidJoao =
    "zOsew1mVu4SkMsUcB1xO6rxs0bw1";

  const uidJoaoFelipe =
    "3onYrlA6AmTMJgz5k1aOdzL2tLk2";

  const uidFabiano =
    "oXpkBSqWJGdt4B6bWZBlVh0uNPA3";

  /*
   * BACKUP ANTES DE QUALQUER ALTERACAO
   */
  const snapshots =
    await Promise.all([
      db.ref(
        `usuarios-v2/${uidJoao}`
      ).get(),

      db.ref(
        `usuarios-v2/${uidJoaoFelipe}`
      ).get(),

      db.ref(
        `usuarios-v2/${uidFabiano}`
      ).get(),
    ]);

  const backup = {
    criadoEm:
      new Date().toISOString(),

    joao:
      snapshots[0].val(),

    joaoFelipe:
      snapshots[1].val(),

    fabiano:
      snapshots[2].val(),
  };

  fs.writeFileSync(
    "backup-usuarios-antes-recuperacao.json",
    JSON.stringify(
      backup,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "BACKUP CRIADO: backup-usuarios-antes-recuperacao.json"
  );

  /*
   * 1. RESTAURA PAINEL DO JOAO / MULLER
   *
   * Esse era o painel que tinha os 4 cards
   * antes das alteracoes.
   */
  const permissoesMuller = {
    receberChamadas: true,
    abrirPortao: true,
    visualizarCameras: true,
    controlarAlarme: true,
  };

  const agora =
    Date.now();

  const atualizacoes = {
    [`usuarios-v2/${uidJoao}/locais/muller/permissoes`]:
      permissoesMuller,

    [`usuarios-v2/${uidJoao}/locais/muller/atualizadoEm`]:
      agora,

    [`usuarios-v2/${uidJoao}/condominios/muller/permissoes`]:
      permissoesMuller,

    [`usuarios-v2/${uidJoao}/condominios/muller/atualizadoEm`]:
      agora,

    [`usuarios-v2/${uidJoao}/atualizadoEm`]:
      agora,

    /*
     * 2. FABIANO NAO E MORADOR
     *
     * Remove somente o perfil morador
     * e a unidade que foram adicionados
     * durante o teste.
     */
    [`usuarios-v2/${uidFabiano}/locais/residencial-tulipas/perfis/morador`]:
      null,

    [`usuarios-v2/${uidFabiano}/locais/residencial-tulipas/unidades`]:
      null,

    [`usuarios-v2/${uidFabiano}/locais/residencial-tulipas/atualizadoEm`]:
      agora,

    [`usuarios-v2/${uidFabiano}/condominios/residencial-tulipas/perfis/morador`]:
      null,

    [`usuarios-v2/${uidFabiano}/condominios/residencial-tulipas/unidades`]:
      null,

    [`usuarios-v2/${uidFabiano}/condominios/residencial-tulipas/atualizadoEm`]:
      agora,

    [`usuarios-v2/${uidFabiano}/atualizadoEm`]:
      agora,
  };

  await db
    .ref()
    .update(
      atualizacoes
    );

  console.log(
    "\nRECUPERACAO CONCLUIDA."
  );

  console.log(
    "Joao Muller: permissoes restauradas."
  );

  console.log(
    "Fabiano: perfil morador/unidade removidos."
  );

  console.log(
    "Joao Felipe: NAO ALTERADO."
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
