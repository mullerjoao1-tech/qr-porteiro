const { loadEnvConfig } = require("@next/env");
const {
  cert,
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const {
  getAuth,
} = require("firebase-admin/auth");
const {
  getDatabase,
} = require("firebase-admin/database");

loadEnvConfig(process.cwd());

const SERVICE_ACCOUNT =
  JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );

if (getApps().length === 0) {
  initializeApp({
    credential: cert(SERVICE_ACCOUNT),
    databaseURL:
      "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  });
}

const database = getDatabase();
const auth = getAuth();

const LOCAL_ID = "residencial-costa";

const NOME = "Valdeir Costa";
const EMAIL =
  "rodovanstransportes@terra.com.br";
const SENHA = "123456";

async function main() {
  console.log("\n=== CADASTRO VALDEIR COSTA ===\n");

  // 1. Confere se o Costa existe
  const localSnap =
    await database
      .ref(`locais-v2/${LOCAL_ID}`)
      .get();

  if (!localSnap.exists()) {
    throw new Error(
      "Residencial Costa não encontrado em locais-v2."
    );
  }

  const local = localSnap.val();

  const localNome =
    local.nome ||
    local.nomeExibicao ||
    "Residencial Costa";

  const localSlug =
    local.slug ||
    LOCAL_ID;

  const tipoLocal =
    local.tipo ||
    local.tipoLocal ||
    "residencia";

  console.log(
    "Local encontrado:",
    localNome
  );

  // 2. Descobre automaticamente unidades do Costa
  const unidadesSnap =
    await database
      .ref("unidades-v2")
      .get();

  const unidades = {};

  if (unidadesSnap.exists()) {
    const todas =
      unidadesSnap.val();

    for (
      const [unidadeId, dados]
      of Object.entries(todas)
    ) {
      const pertence =
        dados?.localId === LOCAL_ID ||
        dados?.condominioId === LOCAL_ID ||
        unidadeId.includes(
          "residencial-costa"
        );

      if (pertence) {
        unidades[unidadeId] = true;
      }
    }
  }

  console.log(
    "Unidades encontradas:",
    Object.keys(unidades)
  );

  // 3. Procura ou cria Authentication
  let usuarioAuth = null;
  let criadoNoAuth = false;

  try {
    usuarioAuth =
      await auth.getUserByEmail(
        EMAIL
      );

    console.log(
      "Login já existia no Authentication."
    );
  } catch (erro) {
    if (
      erro.code !==
      "auth/user-not-found"
    ) {
      throw erro;
    }
  }

  if (!usuarioAuth) {
    usuarioAuth =
      await auth.createUser({
        email: EMAIL,
        password: SENHA,
        displayName: NOME,
        disabled: false,
      });

    criadoNoAuth = true;

    console.log(
      "Login criado no Authentication."
    );
  }

  const uid =
    usuarioAuth.uid;

  const agora =
    Date.now();

  // 4. Vínculo universal
  const vinculoUniversal = {
    localId: LOCAL_ID,

    localNome,

    localNomeBase:
      local.nomeBase ||
      localNome,

    localNomeExibicao:
      local.nomeExibicao ||
      localNome,

    localSlug,

    tipoLocal,

    condominioId:
      LOCAL_ID,

    condominioNome:
      localNome,

    condominioSlug:
      localSlug,

    perfilPrincipal:
      "morador",

    perfis: {
      morador: true,
    },

    unidades,

    ativo: true,

    criadoEm:
      agora,

    atualizadoEm:
      agora,
  };

  // 5. Registro dentro do local
  const referenciaUsuarioLocal = {
    uid,

    nome:
      NOME,

    email:
      EMAIL,

    perfil:
      "morador",

    perfilPrincipal:
      "morador",

    perfis: {
      morador: true,
    },

    unidades,

    ativo: true,

    criadoEm:
      agora,

    atualizadoEm:
      agora,
  };

  // 6. Atualização atômica
  const atualizacoes = {};

  atualizacoes[
    `usuarios-v2/${uid}/uid`
  ] = uid;

  atualizacoes[
    `usuarios-v2/${uid}/nome`
  ] = NOME;

  atualizacoes[
    `usuarios-v2/${uid}/email`
  ] = EMAIL;

  atualizacoes[
    `usuarios-v2/${uid}/status`
  ] = "ativo";

  atualizacoes[
    `usuarios-v2/${uid}/primeiroAcesso`
  ] = criadoNoAuth;

  atualizacoes[
    `usuarios-v2/${uid}/precisaTrocarSenha`
  ] = criadoNoAuth;

  atualizacoes[
    `usuarios-v2/${uid}/atualizadoEm`
  ] = agora;

  atualizacoes[
    `usuarios-v2/${uid}/locais/${LOCAL_ID}`
  ] = vinculoUniversal;

  // Mantemos compatibilidade com a estrutura atual do QR Core
  atualizacoes[
    `usuarios-v2/${uid}/condominios/${LOCAL_ID}`
  ] = vinculoUniversal;

  atualizacoes[
    `locais-v2/${LOCAL_ID}/usuarios/${uid}`
  ] = referenciaUsuarioLocal;

  atualizacoes[
    `locais-v2/${LOCAL_ID}/responsaveis/${uid}`
  ] = {
    uid,

    nome:
      NOME,

    email:
      EMAIL,

    telefone:
      null,

    cpf:
      null,

    perfil:
      "morador",

    ativo:
      true,

    criadoEm:
      agora,

    atualizadoEm:
      agora,
  };

  atualizacoes[
    `locais-v2/${LOCAL_ID}/estatisticas/totalUsuarios`
  ] = 1;

  atualizacoes[
    `locais-v2/${LOCAL_ID}/estatisticas/atualizadoEm`
  ] = agora;

  await database
    .ref()
    .update(
      atualizacoes
    );

  console.log(
    "\n✅ VALDEIR COSTA CADASTRADO COM SUCESSO\n"
  );

  console.log(
    "Nome:",
    NOME
  );

  console.log(
    "E-mail:",
    EMAIL
  );

  console.log(
    "UID:",
    uid
  );

  console.log(
    "Local:",
    LOCAL_ID
  );

  console.log(
    "Unidades:",
    Object.keys(unidades)
  );

  console.log(
    "Login criado agora:",
    criadoNoAuth
  );

  if (criadoNoAuth) {
    console.log(
      "Senha provisória: 123456"
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error(
      "\n❌ ERRO:",
      erro
    );

    process.exit(1);
  });
