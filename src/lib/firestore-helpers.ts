import type { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";

/** Firestore shape for `passes/{userId}` (Admin SDK timestamps). */
export type AdminPassRecord = {
  userId: string;
  passType: string;
  issueDate: Timestamp;
  expiryDate: Timestamp;
  isActive: boolean;
};

const PASSES = "users";

/**
 * Loads the pass document for a commuter (`passes/{userId}`).
 */
export async function getPassByUserId(userId: string): Promise<AdminPassRecord | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(PASSES).doc(userId).get();
  if (!snap.exists) return null;
  return snap.data() as AdminPassRecord;
}

/**
 * Evaluates pass validity against Firestore and server time.
 * Used by the validation API; any missing/inactive/expired pass is treated as expired.
 */
export async function checkPassValidity(userId: string): Promise<"Valid" | "Expired"> {
  const db = getAdminFirestore();
  
  // 1. Look in the "users" collection
  const snap = await db.collection("users").doc(userId).get();
  
  if (!snap.exists) return "Expired";
  
  const data = snap.data();
  const isActive = data?.isActive;
  const expiryDate = data?.expiryDate; // This is a Firestore Timestamp

  // 2. Logic Check: Must be Active AND have a future Date
  if (!isActive || !expiryDate) {
    return "Expired";
  }

  // Convert Firebase Timestamp to a JS Date object
  const expiryJSDate = expiryDate.toDate();

  if (expiryJSDate.getTime() <= Date.now()) {
    return "Expired";
  }

  return "Valid";
}