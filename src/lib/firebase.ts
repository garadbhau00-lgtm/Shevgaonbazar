// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'studio-3190770314-1b610',
  appId: '1:1089552117164:web:aa52227be83d01b9669e09',
  apiKey: 'AIzaSyCtUR86dc86Za110Xew8OIZpjC7nzEuKp0',
  authDomain: 'studio-3190770314-1b610.firebaseapp.com',
  messagingSenderId: '1089552117164',
  storageBucket: 'studio-3190770314-1b610.appspot.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
