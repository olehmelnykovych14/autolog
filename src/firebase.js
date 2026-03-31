import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMifGkzL3l8c_22LLXMpCFL1xyQOrlz1o",
  authDomain: "autolog-app-2d50e.firebaseapp.com",
  projectId: "autolog-app-2d50e",
  storageBucket: "autolog-app-2d50e.firebasestorage.app",
  messagingSenderId: "949805106271",
  appId: "1:949805106271:web:c42b33dfa2b078badf07ea",
  measurementId: "G-CK3EE48Z81"
};

let app, auth, analytics, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, auth, analytics, db };
