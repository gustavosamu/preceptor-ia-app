// HAMDocs — aviso de nota no celular (29/09/2026, pedido do professor).
// Este service worker faz SÓ duas coisas: mostra o aviso SILENCIOSO de nota liberada
// (sem som, sem vibrar) com o número no ícone do app, e abre a página do grupo ao
// tocar. Ele NÃO intercepta nenhum acesso ao site (não há "fetch" aqui): o portal
// continua sempre na versão publicada, sem cópia guardada.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch (_) {
    dados = {}
  }
  const escopo = self.registration.scope
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(dados.titulo || 'HAMDocs', {
        body: dados.corpo || 'Saiu uma nota do seu grupo. Toque para ver.',
        icon: escopo + 'icone-192.png',
        badge: escopo + 'icone-192.png',
        tag: dados.tag || 'hamdocs-nota',
        silent: true,
        data: { url: dados.url || escopo },
      })
      // o número no ícone = quantos avisos de nota estão esperando
      try {
        const abertos = await self.registration.getNotifications()
        if (self.navigator.setAppBadge) await self.navigator.setAppBadge(Math.max(1, abertos.length))
      } catch (_) {
        try {
          if (self.navigator.setAppBadge) await self.navigator.setAppBadge(1)
        } catch (_) {
          /* o celular não mostra número no ícone */
        }
      }
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    (async () => {
      try {
        if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge()
      } catch (_) {
        /* sem número no ícone */
      }
      const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of abertas) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
          try {
            await c.navigate(url)
          } catch (_) {
            /* a janela não deixou navegar: só traz para a frente */
          }
          return c.focus()
        }
      }
      return self.clients.openWindow(url)
    })(),
  )
})
