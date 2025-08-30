// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCDzgQpYFP4_dmAibUvEX8fwafWiFgnNPI",
  authDomain: "incredible-india-89c8e.firebaseapp.com",
  projectId: "incredible-india-89c8e",
  storageBucket: "incredible-india-89c8e.firebasestorage.app",
  messagingSenderId: "684013360789",
  appId: "1:684013360789:web:bddf682db958e3f97f6d9c",
  measurementId: "G-2PYEVE42G0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development, if enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Error connecting to emulators:', error);
  }
}

export default app;