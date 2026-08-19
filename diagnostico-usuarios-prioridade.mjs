import { cert, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

let texto = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();

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

for (const uid of [
  "zOsew1mVu4SkMsUcB1xO6rxs0bw1",
  "3onYrlA6AmTMJgz5k1aOdzL2tLk2",
]) {
  const snap = await db.ref(`usuarios-v2/${uid}`).get();

  console.log("");
  console.log("UID:", uid);
  console.dir(snap.val(), { depth: 2 });
}
