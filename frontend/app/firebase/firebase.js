// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoNm05vgsYs5vl638jPcpDLlPWf3sRkZU",
  authDomain: "internshala-b7502.firebaseapp.com",
  projectId: "internshala-b7502",
  storageBucket: "internshala-b7502.firebasestorage.app",
  messagingSenderId: "707563128808",
  appId: "1:707563128808:web:499f82f85be072d1fe065d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
