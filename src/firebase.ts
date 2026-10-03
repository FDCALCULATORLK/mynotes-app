/**
 * Firebase Configuration & Initialization Module
 * 
 * Loads Firebase configuration from Vite environment variables (VITE_FIREBASE_*).
 * Exports the initialized Firebase App, Auth, and Firestore instances.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Read configuration from environment variables
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if localStorage has saved config (useful if env vars cannot be injected into running dev server)
const LOCAL_CONFIG_KEY = 'mynotes_firebase_runtime_config';
let storedConfig: Record<string, string> = {};
try {
  const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
  if (raw) {
    storedConfig = JSON.parse(raw);
  }
} catch {
  // ignore
}

export const firebaseConfig = {
  apiKey: envConfig.apiKey || storedConfig.apiKey || '',
  authDomain: envConfig.authDomain || storedConfig.authDomain || '',
  projectId: envConfig.projectId || storedConfig.projectId || '',
  storageBucket: envConfig.storageBucket || storedConfig.storageBucket || '',
  messagingSenderId: envConfig.messagingSenderId || storedConfig.messagingSenderId || '',
  appId: envConfig.appId || storedConfig.appId || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

export function saveRuntimeFirebaseConfig(config: typeof firebaseConfig) {
  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
    window.location.reload();
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
  }
}

// Initialize Firebase App safely
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Fallback placeholder so imports don't crash before config is entered
  try {
    app = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: 'AIzaSyPlaceholderForMissingEnvVars000',
      authDomain: 'placeholder.firebaseapp.com',
      projectId: 'placeholder-project',
      storageBucket: 'placeholder.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
    });
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase initialized with fallback placeholder', e);
  }
}

export { app, auth, db };
