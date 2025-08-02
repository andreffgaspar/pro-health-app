import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registrar Service Worker para notificações
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registrado:', registration);
    })
    .catch((error) => {
      console.error('Erro ao registrar Service Worker:', error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
