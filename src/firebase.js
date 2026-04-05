// Firebase initialization for the website builder
// Replace the placeholder values (projectId, etc.) with your own from the Firebase console.

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQRzXDGRC9rzI73fC86M1ybwqvdNFylPw",
  authDomain: "myminiprojectcsy-3fd52.firebaseapp.com",
  projectId: "myminiprojectcsy-3fd52",
  storageBucket: "myminiprojectcsy-3fd52.firebasestorage.app",
  messagingSenderId: "1011778756758",
  appId: "1:1011778756758:web:510185dd2d2c394d1022b7"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

const authInstance = getAuth(app);
const dbInstance = getFirestore(app);
const storageInstance = getStorage(app);

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
