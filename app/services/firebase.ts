import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBAdV3dc8bN938ivb8YAwhQZ3vw6a24Bh0",
  authDomain: "qr-porteiro-app.firebaseapp.com",
  projectId: "qr-porteiro-app",
  storageBucket: "qr-porteiro-app.firebasestorage.app",
  messagingSenderId: "778497713586",
  appId: "1:778497713586:web:786071e95fd847961930ab",
};

const app = initializeApp(firebaseConfig);

export default app;
