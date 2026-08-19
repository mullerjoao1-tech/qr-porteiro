
import { cert, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const chaveTexto = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();

if (!chaveTexto) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY nao encontrada.");
}

let texto = chaveTexto;

if (texto.startsWith("'") && texto.endsWith("'")) {
  texto = texto.slice(1, -1);
}

let dados = JSON.parse(texto);

if (typeof dados === "string") {
  dados = JSON.parse(dados);
}

const app = initializeApp({
  credential: cert({
    projectId: dados.project_id || dados.projectId,
    clientEmail: dados.client_email || dados.clientEmail,
    privateKey: (dados.private_key || dados.privateKey).replace(/\\n/g, "\n"),
  }),
  databaseURL: "https://qr-acesso-studio-default-rtdb.firebaseio.com",
});

const db = getDatabase(app);

const caminho = "unidades-v2/muller-principal/chamada";

const snapshot = await db.ref(caminho).get();

console.log("");
console.log("=== CHAMADA MULLER-PRINCIPAL ===");
console.dir(snapshot.val(), { depth: null });
console.log("");


