import type { Timestamp } from "firebase/firestore";

/**
 * Commuter profile stored in Firestore `users/{uid}`.
 * Document ID matches Firebase Authentication UID.
 */
export type UserProfile = {
  name: string;
  photoUrl: string;
  phone: string;
  /** Account / profile flag; optional for older documents. */
  isActive?: boolean;
};

/**
 * Transit pass stored in Firestore `passes/{userId}`.
 * Document ID equals `userId` for O(1) validation lookups.
 */
export type PassRecord = {
  userId: string;
  passType: string;
  issueDate: Timestamp;
  expiryDate: Timestamp;
  isActive: boolean;
};
