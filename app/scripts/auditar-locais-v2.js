/**
 * PROJETO: QR Acesso
 * TIPO: arquivo
 * CAMINHO: app/scripts/auditar-locais-v2.js
 *
 * Este script NÃO altera o Firebase.
 * Ele apenas lê:
 * - locais-v2
 * - residencias-v2
 * - condominios-v2
 *
 * Compatível com firebase-admin 14 usando imports modulares.
 */

const fs = require("fs");
const path = require("path");

const {
  cert,
  initializeApp,
  deleteApp,
} = require("firebase-admin/app");

const {
  getDatabase,
} = require("firebase-admin/database");

function carregarEnvLocal() {
  const caminho = path.resolve(process.cwd(), ".env.local");

  if (!fs.existsSync(caminho)) {
    throw new Error(
      `.env.local não encontrado em: ${caminho}`
    );
  }

  const linhas = fs
    .readFileSync(caminho, "utf8")
    .split(/\r?\n/);

  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim();

    if (!linha || linha.startsWith("#")) {
      continue;
    }

    const indice = linha.indexOf("=");

    if (indice <= 0) {
      continue;
    }

    const nome = linha
      .slice(0, indice)
      .trim();

    let valor = linha
      .slice(indice + 1)
      .trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    if (!process.env[nome]) {
      process.env[nome] = valor;
    }
  }
}

function obterContaServico() {
  const texto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!texto) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY não encontrada no .env.local."
    );
  }

  let conta;

  try {
    conta = JSON.parse(texto);
  } catch (erro) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_KEY contém JSON inválido: ${
        erro instanceof Error
          ? erro.message
          : String(erro)
      }`
    );
  }

  const projectId =
    conta.project_id ||
    conta.projectId;

  const clientEmail =
    conta.client_email ||
    conta.clientEmail;

  const privateKeyOriginal =
    conta.private_key ||
    conta.privateKey;

  if (
    !projectId ||
    !clientEmail ||
    !privateKeyOriginal
  ) {
    throw new Error(
      "A conta de serviço não possui project_id, client_email ou private_key."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey:
      String(privateKeyOriginal)
        .replace(/\\n/g, "\n"),
  };
}

function obterDatabaseUrl(projectId) {
  const configurada =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (configurada) {
    return configurada.replace(/\/+$/g, "");
  }

  return `https://${projectId}-default-rtdb.firebaseio.com`;
}

function texto(valor) {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function obterTipoLocal(dados) {
  return texto(
    dados.tipoLocal ||
    dados.tipo ||
    dados.segmento
  );
}

async function ler(database, caminho) {
  const snapshot =
    await database.ref(caminho).get();

  if (!snapshot.exists()) {
    return {};
  }

  const valor = snapshot.val();

  return valor &&
    typeof valor === "object"
    ? valor
    : {};
}

async function main() {
  carregarEnvLocal();

  const conta = obterContaServico();

  const databaseURL =
    obterDatabaseUrl(
      conta.projectId
    );

  const app = initializeApp(
    {
      credential: cert(conta),
      databaseURL,
    },
    `auditoria-locais-${Date.now()}`
  );

  const database =
    getDatabase(app);

  console.log(
    "=== AUDITORIA DE LOCAIS V2 ==="
  );

  console.log(
    `Projeto Firebase: ${conta.projectId}`
  );

  console.log(
    `Database URL: ${databaseURL}`
  );

  console.log(
    "Modo: SOMENTE LEITURA"
  );

  console.log("");

  const [
    locais,
    residencias,
    condominios,
  ] = await Promise.all([
    ler(database, "locais-v2"),
    ler(database, "residencias-v2"),
    ler(database, "condominios-v2"),
  ]);

  const problemas = [];
  const slugs = new Map();

  console.log("=== LOCAIS-V2 ===");

  for (
    const [chave, bruto]
    of Object.entries(locais)
  ) {
    const dados =
      bruto &&
      typeof bruto === "object"
        ? bruto
        : {};

    const id =
      texto(dados.id) ||
      chave;

    const slug =
      texto(dados.slug);

    const nome =
      texto(dados.nome);

    const tipo =
      obterTipoLocal(dados);

    const status =
      texto(dados.status);

    console.log(
      `${chave} | id=${id || "-"} | slug=${slug || "-"} | nome=${nome || "-"} | tipo=${tipo || "-"} | status=${status || "-"}`
    );

    const ausentes = [];

    if (!slug) {
      ausentes.push("slug");
    }

    if (!nome) {
      ausentes.push("nome");
    }

    if (!tipo) {
      ausentes.push(
        "tipoLocal/tipo/segmento"
      );
    }

    if (!status) {
      ausentes.push("status");
    }

    if (ausentes.length > 0) {
      problemas.push({
        tipo:
          "campos-ausentes",

        localId:
          chave,

        detalhes:
          ausentes.join(", "),
      });
    }

    if (id !== chave) {
      problemas.push({
        tipo:
          "id-divergente",

        localId:
          chave,

        detalhes:
          `campo id=${id}`,
      });
    }

    if (slug) {
      const lista =
        slugs.get(slug) ||
        [];

      lista.push(chave);

      slugs.set(
        slug,
        lista
      );
    }
  }

  console.log("");
  console.log(
    "=== SLUGS DUPLICADOS ==="
  );

  let duplicado = false;

  for (
    const [slug, ids]
    of slugs.entries()
  ) {
    if (ids.length > 1) {
      duplicado = true;

      console.log(
        `${slug}: ${ids.join(", ")}`
      );

      problemas.push({
        tipo:
          "slug-duplicado",

        localId:
          ids.join(", "),

        detalhes:
          slug,
      });
    }
  }

  if (!duplicado) {
    console.log(
      "Nenhum slug duplicado."
    );
  }

  console.log("");
  console.log(
    "=== RESIDÊNCIAS SEM LOCAIS-V2 ==="
  );

  let faltouResidencia =
    false;

  for (
    const [chave, bruto]
    of Object.entries(residencias)
  ) {
    const dados =
      bruto &&
      typeof bruto === "object"
        ? bruto
        : {};

    const localId =
      texto(dados.localId) ||
      texto(dados.id) ||
      chave;

    if (!locais[localId]) {
      faltouResidencia =
        true;

      console.log(
        `${chave} -> localId ${localId}`
      );

      problemas.push({
        tipo:
          "residencia-sem-local-principal",

        localId,

        detalhes:
          chave,
      });
    }
  }

  if (!faltouResidencia) {
    console.log("Nenhuma.");
  }

  console.log("");
  console.log(
    "=== CONDOMÍNIOS SEM LOCAIS-V2 ==="
  );

  let faltouCondominio =
    false;

  for (
    const [chave, bruto]
    of Object.entries(condominios)
  ) {
    const dados =
      bruto &&
      typeof bruto === "object"
        ? bruto
        : {};

    const localId =
      texto(dados.localId) ||
      texto(dados.id) ||
      chave;

    if (!locais[localId]) {
      faltouCondominio =
        true;

      console.log(
        `${chave} -> localId ${localId}`
      );

      problemas.push({
        tipo:
          "condominio-sem-local-principal",

        localId,

        detalhes:
          chave,
      });
    }
  }

  if (!faltouCondominio) {
    console.log("Nenhum.");
  }

  const relatorio = {
    geradoEm:
      new Date().toISOString(),

    projetoFirebase:
      conta.projectId,

    databaseURL,

    totais: {
      locais:
        Object.keys(locais).length,

      residencias:
        Object.keys(residencias).length,

      condominios:
        Object.keys(condominios).length,

      problemas:
        problemas.length,
    },

    problemas,
  };

  const destino =
    path.resolve(
      process.cwd(),
      "auditoria-locais-v2.json"
    );

  fs.writeFileSync(
    destino,
    JSON.stringify(
      relatorio,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log("=== RESUMO ===");

  console.log(
    `Locais: ${Object.keys(locais).length}`
  );

  console.log(
    `Residências: ${Object.keys(residencias).length}`
  );

  console.log(
    `Condomínios: ${Object.keys(condominios).length}`
  );

  console.log(
    `Problemas: ${problemas.length}`
  );

  console.log(
    `Relatório salvo em: ${destino}`
  );

  await deleteApp(app);
}

main().catch((erro) => {
  console.error("");
  console.error(
    "Falha na auditoria:"
  );

  console.error(
    erro instanceof Error
      ? erro.message
      : String(erro)
  );

  process.exitCode = 1;
});
