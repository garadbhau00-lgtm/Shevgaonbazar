
// CORRECT FIRESTORE RULES
// It is recommended that you copy and paste these rules into your Firebase project's
// Firestore rules editor to ensure the app works correctly.
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // USERS
    // Allow users to read/update their own profile.
    // Admins can read/write any user profile.
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    // Admins can list all users.
     match /users/{document=**} {
      allow list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }

    // ADS
    // Allow anyone to read approved ads.
    // Logged-in users can read their own ads regardless of status.
    // Logged-in users can create ads.
    // Owners can update/delete their own ads.
    // Admins can read/write any ad.
    match /ads/{adId} {
      allow read: if resource.data.status == 'approved'
                   || (request.auth != null && resource.data.userId == request.auth.uid)
                   || (request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin');
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    // Logged-in users can list all ads (will be filtered on the client).
     match /ads/{document=**} {
        allow list: if request.auth != null;
    }
  }
}
*/

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
