import { NextResponse, type NextRequest } from "next/server";
import { validateAndGetUserDetails } from "@/lib/firestore-helpers";
import { parseSignedUserId } from "@/lib/qr-token";

type Body = {
  /** QR payload. Supports signed userId.signature or raw UID. */
  scannedUserId?: string;
  qrPayload?: string;
};

/**
 * POST /api/validate-pass
 * Validates a scanned commuter id against users/{uid} status + expiryDate.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.PASS_QR_HMAC_SECRET;
    if (!secret || secret.length < 16) {
      return NextResponse.json(
        { error: "Server misconfiguration: PASS_QR_HMAC_SECRET" },
        { status: 500 },
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const raw =
      typeof body.scannedUserId === "string"
        ? body.scannedUserId
        : typeof body.qrPayload === "string"
          ? body.qrPayload
          : "";

    if (!raw.trim()) {
      return NextResponse.json({ status: "Expired" as const, user: null });
    }

    const parsedSigned = parseSignedUserId(raw.trim(), secret);
    const userId = parsedSigned ?? raw.trim();

    const result = await validateAndGetUserDetails(userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[validate-pass]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
