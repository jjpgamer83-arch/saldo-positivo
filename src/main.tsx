import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register PWA Service Worker for offline support and installability (apenas na web, nunca no app nativo)
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.location.protocol.startsWith('http') &&
  !Boolean(window.Capacitor?.isNativePlatform?.())
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado com escopo:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
