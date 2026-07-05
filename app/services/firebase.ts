import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging, isSupported } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAdV3dc8bN938ivb8YAwbQZ3vw6a24Bh0",
  authDomain: "qr-porteiro-app.firebaseapp.com",
  databaseURL: "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  projectId: "qr-porteiro-app",
  storageBucket: "qr-porteiro-app.firebasestorage.app",
  messagingSenderId: "778497713586",
  appId: "1:778497713586:web:786071e95fd847961930ab",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const storage = getStorage(app);

export const messagingPromise =
  typeof window !== "undefined"
    ? isSupported().then((supported) =>
        supported ? getMessaging(app) : null
      )
    : Promise.resolve(null);

export default app;