import type { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";

/** Firestore shape for `users/{uid}` (Admin SDK timestamps). */
export type AdminUserRecord = {
  name: string;
  phone: string;
  email?: string;
  college?: string;
  role: "admin" | "conductor" | "commuter";
  status: "pending" | "approved" | "rejected";
  expiryDate: Timestamp;
  isActive: boolean;
};

const USERS = "users";

/**
 * Loads the user document for role/pass validation.
 */
export async function getPassByUserId(userId: string): Promise<AdminUserRecord | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(USERS).doc(userId).get();
  if (!snap.exists) return null;
  return snap.data() as AdminUserRecord;
}

/**
 * Evaluates pass validity against Firestore and server time.
 * Used by the validation API; any missing/inactive/expired pass is treated as expired.
 */
export async function checkPassValidity(userId: string): Promise<"Valid" | "Expired"> {
  const data = await getPassByUserId(userId);
  if (!data) return "Expired";

  const isActive = data.isActive;
  const expiryDate = data.expiryDate;
  if (data.status !== "approved") return "Expired";

  if (!isActive || !expiryDate) {
    return "Expired";
  }

  const expiryJSDate = expiryDate.toDate();

  if (expiryJSDate.getTime() <= Date.now()) {
    return "Expired";
  }

  return "Valid";
}

export type ValidationResult = {
  status: "Valid" | "Expired";
  user: {
    userId: string;
    name: string;
    phone: string;
    email?: string;
    college?: string;
    isActive: boolean;
    status: "pending" | "approved" | "rejected";
    expiryDate?: string;
  } | null;
};

/**
 * Validates commuter pass and returns commuter details for conductor UI.
 */
export async function validateAndGetUserDetails(userId: string): Promise<ValidationResult> {
  const data = await getPassByUserId(userId);
  if (!data) {
    return { status: "Expired", user: null };
  }

  const expiryDate = data.expiryDate?.toDate?.();
  const isExpired = !expiryDate || expiryDate.getTime() <= Date.now();
  const status: "Valid" | "Expired" =
    data.isActive && data.status === "approved" && !isExpired ? "Valid" : "Expired";

  return {
    status,
    user: {
      userId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      college: data.college,
      isActive: data.isActive,
      status: data.status,
      expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
    },
  };
}