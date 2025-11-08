// Este archivo solo debe ser importado en el cliente
// Usa dynamic imports en las páginas que lo necesiten

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Función para inicializar Firebase solo en el cliente
function initFirebase() {
  if (typeof window === "undefined") {
    return { app: null, auth: null };
  }

  if (app && auth) {
    return { app, auth };
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return { app: null, auth: null };
  }

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    return { app, auth };
  } catch (error) {
    console.warn("Firebase initialization error:", error);
    return { app: null, auth: null };
  }
}

// Inicializar en el cliente
if (typeof window !== "undefined") {
  initFirebase();
}

export { app, auth, initFirebase };
