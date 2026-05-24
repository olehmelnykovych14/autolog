import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, enableIndexedDbPersistence, enableNetwork, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app, auth, analytics, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: false,
  });
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
    const isTestOrLocal = window.navigator.webdriver || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    if (!isTestOrLocal) {
      enableIndexedDbPersistence(db).catch(err => {
        console.warn("Offline persistence not enabled:", err.code);
      });
    }
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

let isNetworkEnabled = true;

async function safeEnableNetwork() {
  if (isNetworkEnabled) return;
  try {
    isNetworkEnabled = true;
    await enableNetwork(db);
    console.log("Firestore network enabled safely.");
  } catch (e) {
    console.error("safeEnableNetwork error:", e);
  }
}

async function safeDisableNetwork() {
  if (!isNetworkEnabled) return;
  try {
    isNetworkEnabled = false;
    await disableNetwork(db);
    console.log("Firestore network disabled safely.");
  } catch (e) {
    console.error("safeDisableNetwork error:", e);
  }
}

export { app, auth, analytics, db, safeEnableNetwork, safeDisableNetwork };
