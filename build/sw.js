// Service Worker para Web Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Escutar notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let notificationData = {
    title: 'Pro Health App',
    body: 'Nova notificação',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        tag: data.tag || 'default'
      };
    } catch (error) {
      console.error('Erro ao processar dados do push:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      tag: notificationData.tag
    }
  );

  event.waitUntil(promiseChain);
});

// Escutar cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();

  const clickAction = event.action || 'default';
  const notificationData = event.notification.data || {};

  let urlToOpen = '/';

  // Determinar URL baseado no tipo de notificação
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'message':
        urlToOpen = `/communication?conversation=${notificationData.conversationId || ''}`;
        break;
      case 'appointment':
        urlToOpen = `/athlete-dashboard?section=schedule`;
        break;
      case 'training':
        urlToOpen = `/athlete-dashboard?section=training`;
        break;
      case 'nutrition':
        urlToOpen = `/athlete-dashboard?section=nutrition`;
        break;
      default:
        urlToOpen = '/athlete-dashboard';
    }
  }

  // Ações específicas
  if (clickAction !== 'default' && notificationData.actions) {
    const action = notificationData.actions.find(a => a.action === clickAction);
    if (action && action.url) {
      urlToOpen = action.url;
    }
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Verificar se já há uma janela aberta
    for (let client of windowClients) {
      if (client.url.includes(self.location.origin)) {
        client.focus();
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          url: urlToOpen,
          data: notificationData
        });
        return;
      }
    }
    // Abrir nova janela se não houver uma aberta
    return clients.openWindow(urlToOpen);
  });

  event.waitUntil(promiseChain);
});

// Escutar quando notificação é fechada
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event);
  
  // Enviar analytics se necessário
  const notificationData = event.notification.data || {};
  if (notificationData.trackingId) {
    // Implementar tracking de notificação fechada
  }
});