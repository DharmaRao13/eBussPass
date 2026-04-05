import { createHmac, timingSafeEqual } from "crypto";

/**
 * Builds a tamper-evident QR payload: `userId` + HMAC-SHA256 (base64url).
 * Firebase Auth UIDs do not contain `.`, so a single dot is a safe delimiter.
 */
export function signUserId(userId: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(userId).digest("base64url");
  return `${userId}.${sig}`;
}

/**
 * Verifies HMAC and returns the user ID, or null if invalid.
 */
export function parseSignedUserId(payload: string, secret: string): string | null {
  const dot = payload.lastIndexOf(".");
  if (dot <= 0) return null;

  const userId = payload.slice(0, dot);
  const sig = payload.slice(dot + 1);
  if (!userId || !sig) return null;

  const expected = createHmac("sha256", secret).update(userId).digest("base64url");

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return userId;
}
