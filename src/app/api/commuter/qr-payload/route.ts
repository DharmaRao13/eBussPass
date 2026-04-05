import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { signUserId } from "@/lib/qr-token";

/**
 * GET /api/commuter/qr-payload
 * Authorization: Bearer <Firebase ID token>
 * Returns a signed string to embed in the commuter QR code (server-side secret).
 */
export async function GET(request: NextRequest) {
  try {
    const secret = process.env.PASS_QR_HMAC_SECRET;
    if (!secret || secret.length < 16) {
      return NextResponse.json(
        { error: "Server misconfiguration: PASS_QR_HMAC_SECRET" },
        { status: 500 },
      );
    }

    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization bearer token" }, { status: 401 });
    }

    const idToken = header.slice("Bearer ".length).trim();
    if (!idToken) {
      return NextResponse.json({ error: "Empty token" }, { status: 401 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const qrPayload = signUserId(decoded.uid, secret);

    return NextResponse.json({ qrPayload });
  } catch (err) {
    console.error("[commuter/qr-payload]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
