import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYRwkctyRLcgxRf_gUsSz0NhwsiATBoCA",
  authDomain: "hantapoll.firebaseapp.com",
  projectId: "hantapoll",
  storageBucket: "hantapoll.firebasestorage.app",
  messagingSenderId: "230351358106",
  appId: "1:230351358106:web:b99d342b48f2b4ae22f723"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, writeBatch };