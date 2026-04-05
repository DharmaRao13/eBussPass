import { NextResponse, type NextRequest } from "next/server";
import { checkPassValidity } from "@/lib/firestore-helpers";
import { parseSignedUserId } from "@/lib/qr-token";

type Body = {
  /** Signed QR payload from the commuter app (`userId.signature`). */
  scannedUserId?: string;
  qrPayload?: string;
};

/**
 * POST /api/validate-pass
 * Verifies the signed commuter token, loads Firestore pass, returns { status: 'Valid' | 'Expired' }.
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
      return NextResponse.json({ status: "Expired" as const });
    }

    const userId = parseSignedUserId(raw.trim(), secret);
    if (!userId) {
      return NextResponse.json({ status: "Expired" as const });
    }

    const status = await checkPassValidity(userId);
    return NextResponse.json({ status });
  } catch (err) {
    console.error("[validate-pass]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
