// Import the Firebase modules (make sure to include Firebase libraries via a CDN or package manager)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPzhoI4ZeMfn72u8PiZcDZDiHia7tY46M",
    authDomain: "eloc-international.firebaseapp.com",
    projectId: "eloc-international",
    storageBucket: "eloc-international.appspot.com",
    messagingSenderId: "302583545118",
    appId: "1:302583545118:web:8fb06e7c1b58c7516d1d0f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);