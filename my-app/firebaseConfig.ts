import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJPNa1zDMy33R5CB9kka_7SxUDKJWJJ9g",
  authDomain: "sample-project-37d6d.firebaseapp.com",
  projectId: "sample-project-37d6d",
  storageBucket: "sample-project-37d6d.appspot.com",
  messagingSenderId: "16513409954",
  appId: "1:16513409954:android:188a163f032469f70d48fb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);