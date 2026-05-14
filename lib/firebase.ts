import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdaETo28PC0Qef-bVjqRirNs7RLoL_3FY",
  authDomain: "sentinela-360-3a05f.firebaseapp.com",
  projectId: "sentinela-360-3a05f",
  storageBucket: "sentinela-360-3a05f.firebasestorage.app",
  messagingSenderId: "606495257089",
  appId: "1:606495257089:web:873b0bdf3ff8a31c584600",
  measurementId: "G-HKJJZCRRB3",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
