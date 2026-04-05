"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Client-side Firebase configuration (public keys only).
 * Set these in `.env.local` with the `NEXT_PUBLIC_` prefix.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      "Missing Firebase client env vars. Copy .env.local.example to .env.local and fill values.",
    );
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

/** Firebase Auth (commuter sign-in). */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/** Firestore for commuter reads (profile + pass mirror on client). */
export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
