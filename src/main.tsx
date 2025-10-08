// import { StrictMode } from 'react' // Removido temporariamente para debug
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Desregistrar service worker se existir
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById('root')!).render(
  // StrictMode removido temporariamente para debug de múltiplas requisições
  // <StrictMode>
    <App />
  // </StrictMode>,
)
