/**
 * PROJETO: QR Acesso
 * TIPO: arquivo
 * CAMINHO: app/scripts/preparar-migracao-locais-v2.js
 *
 * OBJETIVO:
 * - Ler condominios-v2 e qrCentral/locais.
 * - Comparar com locais-v2.
 * - Preparar os cadastros principais que faltam.
 *
 * SEGURANÇA:
 * - Por padrão NÃO grava nada.
 * - Para gravar, execute com --aplicar.
 * - Nunca sobrescreve um local já existente em locais-v2.
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
    throw new Error(`.env.local não encontrado em: ${caminho}`);
  }

  const linhas = fs.readFileSync(caminho, "utf8").split(/\r?\n/);

  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim();

    if (!linha || linha.startsWith("#")) {
      continue;
    }

    const indice = linha.indexOf("=");

    if (indice <= 0) {
      continue;
    }

    const nome = linha.slice(0, indice).trim();
    let valor = linha.slice(indice + 1).trim();

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
  const texto = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

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
        erro instanceof Error ? erro.message : String(erro)
      }`
    );
  }

  const projectId = conta.project_id || conta.projectId;
  const clientEmail = conta.client_email || conta.clientEmail;
  const privateKeyOriginal = conta.private_key || conta.privateKey;

  if (!projectId || !clientEmail || !privateKeyOriginal) {
    throw new Error(
      "A conta de serviço não possui project_id, client_email ou private_key."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: String(privateKeyOriginal).replace(/\\n/g, "\n"),
  };
}

function obterDatabaseUrl(projectId) {
  const configurada =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  return configurada
    ? configurada.replace(/\/+$/g, "")
    : `https://${projectId}-default-rtdb.firebaseio.com`;
}

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function gerarSlug(valor) {
  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function statusPadrao(dados) {
  const status = texto(dados.status).toLowerCase();

  if (status) {
    return status;
  }

  if (dados.ativo === false) {
    return "inativo";
  }

  return "ativo";
}

function criarCadastroPrincipal({
  chaveOrigem,
  dados,
  origem,
}) {
  const id =
    texto(dados.id) ||
    texto(dados.localId) ||
    texto(dados.slug) ||
    chaveOrigem;

  const slug =
    texto(dados.slug) ||
    gerarSlug(dados.nome) ||
    gerarSlug(id);

  const nome =
    texto(dados.nome) ||
    slug ||
    id;

  const agora = Date.now();

  return {
    chaveDestino: id,
    dados: {
      ...dados,
      id,
      localId: id,
      slug,
      nome,
      tipo: "condominio",
      tipoLocal: "condominio",
      segmento: "condominio",
      status: statusPadrao(dados),
      ativo: dados.ativo !== false,
      origemPadronizacao: origem,
      atualizadoEm: dados.atualizadoEm || agora,
      criadoEm: dados.criadoEm || agora,
    },
  };
}

async function ler(database, caminho) {
  const snapshot = await database.ref(caminho).get();

  if (!snapshot.exists()) {
    return {};
  }

  const valor = snapshot.val();

  return valor && typeof valor === "object" ? valor : {};
}

async function main() {
  carregarEnvLocal();

  const aplicar = process.argv.includes("--aplicar");

  const conta = obterContaServico();
  const databaseURL = obterDatabaseUrl(conta.projectId);

  const app = initializeApp(
    {
      credential: cert(conta),
      databaseURL,
    },
    `preparar-migracao-${Date.now()}`
  );

  const database = getDatabase(app);

  console.log("=== PADRONIZAÇÃO DE LOCAIS V2 ===");
  console.log(`Projeto Firebase: ${conta.projectId}`);
  console.log(`Database URL: ${databaseURL}`);
  console.log(`Modo: ${aplicar ? "APLICAR" : "SIMULAÇÃO — NÃO GRAVA"}`);
  console.log("");

  const [
    locais,
    condominios,
    locaisLegados,
  ] = await Promise.all([
    ler(database, "locais-v2"),
    ler(database, "condominios-v2"),
    ler(database, "qrCentral/locais"),
  ]);

  const candidatos = [];
  const ignorados = [];

  for (const [chave, bruto] of Object.entries(condominios)) {
    const dados =
      bruto && typeof bruto === "object"
        ? bruto
        : {};

    const cadastro = criarCadastroPrincipal({
      chaveOrigem: chave,
      dados,
      origem: "migracao-condominios-v2",
    });

    if (locais[cadastro.chaveDestino]) {
      ignorados.push({
        origem: `condominios-v2/${chave}`,
        motivo: "já existe em locais-v2",
        destino: cadastro.chaveDestino,
      });
      continue;
    }

    candidatos.push({
      origem: `condominios-v2/${chave}`,
      ...cadastro,
    });
  }

  for (const [chave, bruto] of Object.entries(locaisLegados)) {
    const dados =
      bruto && typeof bruto === "object"
        ? bruto
        : {};

    const cadastro = criarCadastroPrincipal({
      chaveOrigem: chave,
      dados,
      origem: "migracao-qrCentral-locais",
    });

    const jaExistePorChave = Boolean(
      locais[cadastro.chaveDestino]
    );

    const jaExistePorSlug = Object.values(locais).some(
      (local) =>
        local &&
        typeof local === "object" &&
        texto(local.slug) === cadastro.dados.slug
    );

    const jaFoiIncluido = candidatos.some(
      (item) =>
        item.chaveDestino === cadastro.chaveDestino ||
        item.dados.slug === cadastro.dados.slug
    );

    if (
      jaExistePorChave ||
      jaExistePorSlug ||
      jaFoiIncluido
    ) {
      ignorados.push({
        origem: `qrCentral/locais/${chave}`,
        motivo: "local ou slug já existe/foi preparado",
        destino: cadastro.chaveDestino,
      });
      continue;
    }

    candidatos.push({
      origem: `qrCentral/locais/${chave}`,
      ...cadastro,
    });
  }

  console.log("=== CANDIDATOS À MIGRAÇÃO ===");

  if (candidatos.length === 0) {
    console.log("Nenhum cadastro novo precisa ser criado.");
  }

  for (const item of candidatos) {
    console.log(
      `- ${item.origem} -> locais-v2/${item.chaveDestino} | slug=${item.dados.slug} | nome=${item.dados.nome}`
    );
  }

  console.log("");
  console.log("=== IGNORADOS ===");

  if (ignorados.length === 0) {
    console.log("Nenhum.");
  } else {
    for (const item of ignorados) {
      console.log(
        `- ${item.origem} | ${item.motivo} | destino=${item.destino}`
      );
    }
  }

  const plano = {
    geradoEm: new Date().toISOString(),
    projetoFirebase: conta.projectId,
    databaseURL,
    modo: aplicar ? "aplicar" : "simulacao",
    candidatos: candidatos.map((item) => ({
      origem: item.origem,
      destino: `locais-v2/${item.chaveDestino}`,
      dados: item.dados,
    })),
    ignorados,
  };

  const caminhoPlano = path.resolve(
    process.cwd(),
    "plano-migracao-locais-v2.json"
  );

  fs.writeFileSync(
    caminhoPlano,
    JSON.stringify(plano, null, 2),
    "utf8"
  );

  console.log("");
  console.log(`Plano salvo em: ${caminhoPlano}`);

  if (!aplicar) {
    console.log("");
    console.log(
      "Nenhum dado foi alterado. Revise o plano antes de usar --aplicar."
    );

    await deleteApp(app);
    return;
  }

  const atualizacoes = {};

  for (const item of candidatos) {
    atualizacoes[`locais-v2/${item.chaveDestino}`] =
      item.dados;
  }

  if (Object.keys(atualizacoes).length > 0) {
    await database.ref().update(atualizacoes);
  }

  console.log("");
  console.log(
    `Migração concluída. ${Object.keys(atualizacoes).length} local(is) criado(s) em locais-v2.`
  );

  await deleteApp(app);
}

main().catch((erro) => {
  console.error("");
  console.error("Falha na preparação da migração:");
  console.error(
    erro instanceof Error ? erro.message : String(erro)
  );
  process.exitCode = 1;
});
