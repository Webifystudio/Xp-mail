import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBNyk5Qh-qpSCHBkKIsoOdzToQ8F9vKQ8A",
    authDomain: "xp-network-96e8f.firebaseapp.com",
    projectId: "xp-network-96e8f",
    storageBucket: "xp-network-96e8f.appspot.com",
    messagingSenderId: "567445058390",
    appId: "1:567445058390:web:57907617049c679e889cf7",
    measurementId: "G-NZBQC708NM"
  };

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
