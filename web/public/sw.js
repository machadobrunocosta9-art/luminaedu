// Service worker do Lumina.
// Responsavel por receber notificacoes push e abrir a tela certa ao tocar.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let dados = {};

  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = {};
  }

  const titulo = dados.titulo || "Lumina";
  const opcoes = {
    body: dados.corpo || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: dados.url || "/portal-familia" },
    tag: dados.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = event.notification.data?.url || "/portal-familia";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(destino);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(destino);
        }
      }),
  );
});
