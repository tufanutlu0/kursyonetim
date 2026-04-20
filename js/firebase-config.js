// ============================================================
// Firebase Config — Yıldız Kurs ERP
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcUDxYBLp97h5leXJMsFCfCS3pDq2OqaE",
  authDomain: "notlarim-5705d.firebaseapp.com",
  projectId: "notlarim-5705d",
  storageBucket: "notlarim-5705d.firebasestorage.app",
  messagingSenderId: "132462317345",
  appId: "1:132462317345:web:86c6fb946892e681d6f860",
  measurementId: "G-NL17KLN1S6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

try { getAnalytics(app); } catch(e) { /* Analytics blocked — sessizce geç */ }

// Global hata/yardım
window.YK = window.YK || {};
window.YK.db = db;
window.YK.auth = auth;
