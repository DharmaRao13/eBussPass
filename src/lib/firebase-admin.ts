import * as admin from "firebase-admin";

/**
 * Lazily initializes the Firebase Admin SDK (server-only).
 * Requires `FIREBASE_SERVICE_ACCOUNT_KEY` JSON string in the environment.
 */
export function getAdminApp(): typeof admin {
  if (admin.apps.length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Paste your service account JSON as a single-line string.",
      );
    }
    const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}
