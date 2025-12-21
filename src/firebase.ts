import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 🔥 변경: firestore 임포트

const firebaseConfig = {
  apiKey: "AIzaSyDUtJIAGXJAqbq9vEeTfH_P0XLTJBtNtIE",
  authDomain: "korean-dalgom.firebaseapp.com",
  projectId: "korean-dalgom",
  storageBucket: "korean-dalgom.firebasestorage.app",
  messagingSenderId: "829421639741",
  appId: "1:829421639741:web:016c8f3631c78a4cf0f254",
  measurementId: "G-YCDWE3D4T5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // 🔥 변경: getDatabase 대신 getFirestore