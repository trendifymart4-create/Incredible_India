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
