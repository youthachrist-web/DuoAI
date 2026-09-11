/**
 * Service worker que existe só para se apagar a si próprio.
 *
 * O painel antigo instalava-se como app no telemóvel e guardava os seus próprios
 * ficheiros. Depois de o servidor passar a servir o painel novo, o telemóvel
 * continuava a mostrar o antigo a partir do cache — com o desenho de antes e 404
 * em todos os dados, porque a API que ele conhecia já não existe.
 *
 * O browser vai buscar este ficheiro ao verificar se há versão nova do service
 * worker. Encontra este, que limpa tudo, se desregista e manda recarregar as
 * páginas abertas. A partir daí não há mais nada entre o telemóvel e o servidor.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) await caches.delete(nome);
      await self.registration.unregister();
      for (const cliente of await self.clients.matchAll({ type: "window" })) {
        cliente.navigate(cliente.url);
      }
    })(),
  );
});

// Enquanto este ainda estiver activo, nada é servido do cache.
self.addEventListener("fetch", (evento) => evento.respondWith(fetch(evento.request)));
