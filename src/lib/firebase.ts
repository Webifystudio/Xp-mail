import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBNyk5Qh-qpSCHBkKIsoOdzToQ8F9vKQ8A",
    authDomain: "xp-network-96e8f.firebaseapp.com",
    databaseURL: "https://xp-network-96e8f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xp-network-96e8f",
    storageBucket: "xp-network-96e8f.firebasestorage.app",
    messagingSenderId: "567445058390",
    appId: "1:567445058390:web:56476f461ba4bf67889cf7",
    measurementId: "G-D82XFPXLDM"
  };

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
