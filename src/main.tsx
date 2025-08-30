import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import MobileApp from './MobileApp.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { FavoritesProvider } from './context/FavoritesContext.tsx';
import { TranslationProvider } from './context/TranslationContext.tsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { isMobileDevice } from './utils/deviceDetection';

console.log('main.tsx: App initialization started');

// Check if device is mobile
const isMobile = isMobileDevice();
console.log('main.tsx: Device type detected', { isMobile });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/mobile/*" element={<MobileApp />} />
              <Route path="*" element={<App />} />
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </AuthProvider>
    </TranslationProvider>
  </StrictMode>
);

console.log('main.tsx: App initialization completed');

// Register service worker for push notifications and PWA features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available, prompting for update');
                // Could show update notification here
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else {
  console.warn('Service Worker not supported in this browser');
}
