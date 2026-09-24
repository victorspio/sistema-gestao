import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ─── Verificação de configuração ─────────────────────────────────────────────
// Retorna true se o .env estiver preenchido com a chave mínima (apiKey)
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// ─── Configuração do Firebase ─────────────────────────────────────────────────
// Todas as credenciais vêm exclusivamente do arquivo .env
// Preencha o .env antes de rodar a aplicação
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? "",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     ?? "",
};

// ─── Inicialização (só executa se estiver configurado) ───────────────────────
let appInstance = null;
let firestoreDb  = null;
let authInstance = null;
let storageInstance = null;

if (isFirebaseConfigured) {
  appInstance = getApps().find(a => a.name === "[DEFAULT]")
    ?? initializeApp(firebaseConfig);

  // Firestore com cache local persistente (IndexedDB) para melhor performance
  try {
    firestoreDb = initializeFirestore(appInstance, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    firestoreDb = getFirestore(appInstance);
  }

  authInstance    = getAuth(appInstance);
  storageInstance = getStorage(appInstance);
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export const app     = appInstance;
export const auth    = authInstance;
export const storage = storageInstance;
export const db      = firestoreDb;