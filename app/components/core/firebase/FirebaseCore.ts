import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const camposObrigatorios = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["NEXT_PUBLIC_FIREBASE_DATABASE_URL", firebaseConfig.databaseURL],
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
  [
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    firebaseConfig.messagingSenderId,
  ],
  ["NEXT_PUBLIC_FIREBASE_APP_ID", firebaseConfig.appId],
];

const camposAusentes = camposObrigatorios
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome);

if (camposAusentes.length > 0) {
  throw new Error(
    `Configuração Firebase incompleta. Verifique no .env.local: ${camposAusentes.join(
      ", "
    )}`
  );
}

const app =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * Firebase Realtime Database
 */
export const db = getDatabase(app);

/**
 * Firebase Authentication
 *
 * Será usado pelo login de moradores, síndicos
 * e futuros usuários da plataforma.
 */
export const auth = getAuth(app);

/**
 * Firebase Cloud Messaging
 *
 * Mantido exatamente no mesmo formato para não
 * interferir no funcionamento atual dos push.
 */
export const messagingPromise =
  typeof window !== "undefined"
    ? isSupported().then((supported) =>
        supported ? getMessaging(app) : null
      )
    : Promise.resolve(null);

export default app;