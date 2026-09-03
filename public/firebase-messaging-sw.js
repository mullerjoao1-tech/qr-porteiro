/* QR Acesso Studio Ã¢â‚¬â€ Firebase Cloud Messaging Service Worker */

importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBAdV3dc8bN938ivb8YAwhQZ3vw6a24Bh0",
  authDomain: "QR Acesso.firebaseapp.com",
  databaseURL: "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  projectId: "QR Acesso",
  storageBucket: "QR Acesso.firebasestorage.app",
  messagingSenderId: "778497713586",
  appId: "1:778497713586:web:786071e95fd847961930ab",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw] NotificaÃƒÂ§ÃƒÂ£o recebida em segundo plano:",
    payload
  );

  const dados = payload.data || {};
  const notificacao = payload.notification || {};

  const titulo =
    notificacao.title ||
    dados.titulo ||
    "Ã°Å¸â€œÂ¢ Novo comunicado";

  const mensagem =
    notificacao.body ||
    dados.mensagem ||
    "VocÃƒÂª recebeu uma nova comunicaÃƒÂ§ÃƒÂ£o do condomÃƒÂ­nio.";

  const unidadeId = dados.unidadeId || "";
  const comunicadoId = dados.comunicadoId || "";

  let urlDestino = "/";

  if (dados.tipo === "comunicado-v2" && unidadeId) {
    const condominioId = dados.condominioId || "";

    urlDestino =
      `/dashboard/morador/comunicados` +
      `?local=${encodeURIComponent(condominioId)}` +
      `&unidade=${encodeURIComponent(unidadeId)}` +
      (comunicadoId
        ? `&comunicado=${encodeURIComponent(comunicadoId)}`
        : "");
  } else if (dados.tipo === "chamada-v2" && unidadeId) {
    urlDestino = `/morador-v2/${encodeURIComponent(unidadeId)}`;
  } else if (dados.tipo === "teste-push-v2" && unidadeId) {
    urlDestino = `/morador-v2/${encodeURIComponent(unidadeId)}`;
  }

  return self.registration.showNotification(titulo, {
    body: mensagem,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag:
  dados.tipo === "comunicado-v2"
    ? `comunicado-${comunicadoId || Date.now()}-${Date.now()}`
    : `chamada-${unidadeId || "sem-unidade"}`,
    renotify: true,
    requireInteraction: dados.tipo === "chamada-v2",

    vibrate:
      dados.tipo === "chamada-v2"
        ? [
            500,
            250,
            500,
            250,
            500,
            250,
            1000,
          ]
        : undefined,
    data: {
      ...dados,
      url: urlDestino,
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlDestino =
    event.notification?.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (janelas) => {
        for (const janela of janelas) {
          try {
            const urlAtual = new URL(janela.url);
            const urlNova = new URL(urlDestino, self.location.origin);

            if (urlAtual.origin === urlNova.origin) {
              await janela.navigate(urlNova.href);
              return janela.focus();
            }
          } catch (erro) {
            console.error(
              "[firebase-messaging-sw] Erro ao abrir janela:",
              erro
            );
          }
        }

        return clients.openWindow(urlDestino);
      })
  );
});
