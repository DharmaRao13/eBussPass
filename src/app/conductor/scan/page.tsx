"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useEffect } from "react"; // Added useEffect
import dynamic from 'next/dynamic'; // Added dynamic import
import { RoleGuard } from "@/components/auth/RoleGuard";

// --- CHANGE 1: DYNAMIC IMPORT ---
// This tells Next.js: "Only load this library in the browser, never on the server."
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

type ScanOutcome = "idle" | "scanning" | "valid" | "expired" | "error";
type ScannedUser = {
  userId: string;
  name: string;
  phone: string;
  email?: string;
  college?: string;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  expiryDate?: string;
};

export default function ConductorScanPage() {
  const [outcome, setOutcome] = useState<ScanOutcome>("scanning");
  const [message, setMessage] = useState<string | null>(null);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  
  // --- CHANGE 2: MOUNTING GUARD ---
  // We use this to wait until the browser window is 100% ready.
  const [isMounted, setIsMounted] = useState(false);
  
  const lastSent = useRef<string>("");
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validatePayload = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === lastSent.current) return;
    lastSent.current = trimmed;

    if (cooldown.current) clearTimeout(cooldown.current);
    cooldown.current = setTimeout(() => {
      lastSent.current = "";
    }, 2500);

    try {
      const res = await fetch("/api/validate-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannedUserId: trimmed }),
      });

      if (!res.ok) {
        setOutcome("error");
        setMessage("Validation request failed. Try again.");
        return;
      }

      const data = (await res.json()) as { status?: string; user?: ScannedUser | null };
      setScannedUser(data.user ?? null);
      if (data.status === "Valid") {
        setOutcome("valid");
        setMessage(null);
      } else {
        setOutcome("expired");
        setMessage(null);
      }
    } catch (e) {
      console.error(e);
      setOutcome("error");
      setMessage("Network error. Check connection and try again.");
    }
  }, []);

  const resumeScan = useCallback(() => {
    setOutcome("scanning");
    setMessage(null);
    setScannedUser(null);
    lastSent.current = "";
  }, []);

  // --- UI RENDER LOGIC ---

  if (outcome === "valid") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-600 text-white">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/90 bg-emerald-500 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-16 w-16">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-2xl font-bold tracking-wide">VALID</p>
        {scannedUser && (
          <div className="mt-5 w-full max-w-md rounded-2xl bg-white/10 p-4 text-sm">
            <p><span className="font-semibold">Name:</span> {scannedUser.name}</p>
            <p><span className="font-semibold">Phone:</span> {scannedUser.phone}</p>
            <p><span className="font-semibold">Email:</span> {scannedUser.email || "—"}</p>
            <p><span className="font-semibold">College:</span> {scannedUser.college || "—"}</p>
            <p><span className="font-semibold">User ID:</span> {scannedUser.userId}</p>
            <p><span className="font-semibold">Expiry:</span> {scannedUser.expiryDate ? new Date(scannedUser.expiryDate).toLocaleString() : "—"}</p>
          </div>
        )}
        <button type="button" onClick={resumeScan} className="mt-10 rounded-full bg-white px-8 py-3 text-sm font-semibold text-emerald-700 shadow">
          Scan next
        </button>
      </div>
    );
  }

  if (outcome === "expired") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 text-white">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/90 bg-red-500 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-14 w-14">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-2xl font-bold tracking-wide">EXPIRED</p>
        {scannedUser && (
          <div className="mt-5 w-full max-w-md rounded-2xl bg-white/10 p-4 text-sm">
            <p><span className="font-semibold">Name:</span> {scannedUser.name}</p>
            <p><span className="font-semibold">Phone:</span> {scannedUser.phone}</p>
            <p><span className="font-semibold">Email:</span> {scannedUser.email || "—"}</p>
            <p><span className="font-semibold">College:</span> {scannedUser.college || "—"}</p>
            <p><span className="font-semibold">User ID:</span> {scannedUser.userId}</p>
            <p><span className="font-semibold">Approval:</span> {scannedUser.status}</p>
            <p><span className="font-semibold">Active:</span> {scannedUser.isActive ? "Yes" : "No"}</p>
          </div>
        )}
        <button type="button" onClick={resumeScan} className="mt-10 rounded-full bg-white px-8 py-3 text-sm font-semibold text-red-700 shadow">
          Scan again
        </button>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["conductor", "admin"]}>
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col px-4 py-8 bg-zinc-950 text-white">
        <header className="mb-6 text-left">
          <h1 className="text-2xl font-semibold text-white">Conductor Dashboard</h1>
          <p className="text-sm text-zinc-300">High-contrast QR scanner for pass validation</p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-black shadow-lg aspect-square">
          {/* --- CHANGE 3: CONDITIONAL RENDER + CONSTRAINTS --- */}
          {isMounted && (
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  validatePayload(result[0].rawValue);
                }
              }}
              onError={(error) => console.error("Scanner Error:", error)}
              constraints={{ facingMode: "environment" }} // Forces back camera
              allowMultiple={false}
              scanDelay={2000}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 leading-relaxed">
          Ensure you are on an HTTPS connection. Allow camera access when prompted.
        </p>

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-emerald-400 underline">Home</Link>
        </p>
      </div>
    </RoleGuard>
  );
}