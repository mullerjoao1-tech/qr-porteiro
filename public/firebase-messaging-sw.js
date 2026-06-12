importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBAdV3dc8bN938ivb8YAwqZ3vw6a24Bh0",
  authDomain: "qr-porteiro-app.firebaseapp.com",
  databaseURL: "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  projectId: "qr-porteiro-app",
  storageBucket: "qr-porteiro-app.firebasestorage.app",
  messagingSenderId: "778497713586",
  appId: "1:778497713586:web:786071e95fd847961930ab",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/window.svg",
  });
});