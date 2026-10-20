import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@firebasegen/default-connector';
import { Logger } from '@firebase/logger';

// Prevent DataConnect connector 404 from throwing unhandled console.errors in the browser
try {
  if (typeof Logger !== 'undefined' && Logger.prototype && Logger.prototype.error) {
    const originalError = Logger.prototype.error;
    Logger.prototype.error = function (...args: unknown[]) {
      try {
        const text = args
          .map(a => {
            if (typeof a === 'string') return a;
            if (a && typeof a === 'object') {
              try {
                return (a as Record<string, unknown>).message ? String((a as Record<string, unknown>).message) : JSON.stringify(a);
              } catch {
                return String(a);
              }
            }
            return String(a);
          })
          .join(' ');
        if (
          text.includes('connectors/default') ||
          (text.includes('404') && text.includes('NOT_FOUND'))
        ) {
          console.warn('[DataConnect Aviso - Conector ainda não publicado]:', ...args);
          return;
        }
      } catch (_) {}
      originalError.apply(this, args);
    };
  }
} catch (_) {}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const dataConnect = getDataConnect(app, connectorConfig);
export default app;

