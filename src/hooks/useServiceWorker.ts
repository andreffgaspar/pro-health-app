import { useEffect } from 'react';

// Hook para registrar o Service Worker
export const useServiceWorker = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);
};

// Hook para escutar mensagens do Service Worker
export const useServiceWorkerMessages = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Mensagem do Service Worker:', event.data);
        
        // Lidar com cliques em notificações
        if (event.data.type === 'NOTIFICATION_CLICK') {
          const { url } = event.data;
          if (url && url !== window.location.pathname) {
            window.location.href = url;
          }
        }
      });
    }
  }, []);
};