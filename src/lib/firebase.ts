

// CORRECT FIRESTORE RULES & INDEXES
// It is recommended that you copy and paste these into your Firebase project's
// Firestore console to ensure the app works correctly.

/*
RULES:
Paste these into the "Rules" tab of your Firestore database.
(Build > Firestore Database > Rules)

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // USERS
    // Allow anyone to read user profiles to display seller names.
    // Allow new users to create their own profile.
    // Allow users to update their own profile.
    // Admins can write any user profile.
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    // Admins can list all users.
     match /users/{document=**} {
      allow list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }

    // ADS
    // Allow anyone to read approved ads.
    // Logged-in users can read their own ads regardless of status.
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
    // Rules for listing ads
    match /ads/{document=**} {
      allow list: if (request.query.where.status == 'approved')
                  || (request.auth != null && request.query.where.userId == request.auth.uid)
                  || (request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin' && request.query.where.status == 'pending');
    }


    // CONVERSATIONS & MESSAGES
    // Allow users to read, write, and create conversations they are a part of.
    match /conversations/{conversationId} {
      allow read, write, create: if request.auth != null && request.auth.uid in resource.data.participants;

      // Allow users to read and write messages within a conversation they are part of.
      match /messages/{messageId} {
        allow read, write, create: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      }
    }
    // Users can list conversations they are part of.
    match /conversations/{document=**} {
       allow list: if request.auth != null && request.auth.uid == request.query.where.participants['array-contains'];
    }

    // CONFIG
    // Allow anyone to read public configuration.
    // Only admins can write to configuration.
     match /config/{configId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
  }
}
*/

/*
INDEXES:
You need to create a composite index for the main ads query. Go to the "Indexes" tab
in your Firestore console and create a new index with these settings:

- Collection ID: ads
- Fields to index:
  1. status (Ascending)
  2. createdAt (Descending)
- Query scope: Collection

You need to create composite indexes for the chat queries.

- Collection ID: conversations
- Fields to index:
  1. adId (Ascending)
  2. participants (Array-contains)
- Query scope: Collection

- Collection ID: conversations
- Fields to index:
  1. participants (Array-contains)
  2. lastMessageTimestamp (Descending)
- Query scope: Collection

- Collection ID: messages
- Fields to index:
  1. timestamp (Ascending)
- Query scope: Collection Group
  
- Collection ID: ads
- Fields to index:
  1. userId (Ascending)
- Query scope: Collection

- Collection ID: ads
- Fields to index:
  1. status (Ascending)
  2. createdAt (Ascending)
- Query scope: Collection
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
