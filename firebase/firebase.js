import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyARVe00XzKfXxjsla-nYyvwBxGjU4yFzcI",
  authDomain: "steadly-9734e.firebaseapp.com",
  projectId: "steadly-9734e",
  storageBucket: "steadly-9734e.appspot.com",
  messagingSenderId: "559712906722",
  appId: "1:559712906722:web:4720b11c3008cafcfd9dbb",
  measurementId: "G-ETMSVQQSES"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
