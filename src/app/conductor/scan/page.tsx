"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useEffect } from "react"; // Added useEffect
import dynamic from 'next/dynamic'; // Added dynamic import
import { CurrentUserBanner } from "@/components/auth/CurrentUserBanner";
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
type ScanHistoryItem = {
  scannedAt: string;
  status: "Valid" | "Expired";
  user: ScannedUser | null;
};
const HISTORY_KEY = "ebuspass:last_scans";

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
      const fetchedUser = data.user ?? null;
      setScannedUser(fetchedUser);

      // --- 1. NEW STRICT VALIDATION LOGIC ---
      let finalStatus: "Valid" | "Expired" = "Expired"; // Default to expired for safety

      if (fetchedUser) {
        let isExpired = true;

        if (fetchedUser.expiryDate) {
          // Parse the date string returned by the API
          const expiryTime = new Date(fetchedUser.expiryDate).getTime();
          isExpired = Date.now() >= expiryTime;
        }

        // Pass MUST be active, NOT expired, and approved by an admin
        const isValid = fetchedUser.isActive === true && !isExpired && fetchedUser.status === "approved";
        finalStatus = isValid ? "Valid" : "Expired";
      }
      // --- END NEW LOGIC ---

      // 2. Save to history using our new strictly calculated finalStatus
      const current: ScanHistoryItem = {
        scannedAt: new Date().toISOString(),
        status: finalStatus,
        user: fetchedUser,
      };
      const prevRaw = window.localStorage.getItem(HISTORY_KEY);
      const prev = prevRaw ? (JSON.parse(prevRaw) as ScanHistoryItem[]) : [];
      const next = [current, ...prev].slice(0, 15);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));

      // 3. Update the Conductor UI
      if (finalStatus === "Valid") {
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
          <div className="mt-8 w-full max-w-sm rounded-3xl border border-emerald-700/70 bg-gradient-to-br from-zinc-800 to-zinc-900 p-5 shadow-[0_0_30px_rgba(16,185,129,0.5)] text-left">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-400">Telangana RTC</p>
                <h3 className="mt-1 text-xl font-extrabold text-white">eBusPass ID</h3>
              </div>
              <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase bg-emerald-500 text-black">
                Valid
              </span>
            </div>
            <div className="mt-5 space-y-1 text-sm text-zinc-200">
              <p><span className="text-zinc-400">Name:</span> {scannedUser.name}</p>
              <p><span className="text-zinc-400">Phone:</span> {scannedUser.phone || "—"}</p>
              <p><span className="text-zinc-400">College:</span> {scannedUser.college || "—"}</p>
              <p className="truncate"><span className="text-zinc-400">Pass ID:</span> {scannedUser.userId}</p>
              <p><span className="text-zinc-400">Expires:</span> {scannedUser.expiryDate ? new Date(scannedUser.expiryDate).toLocaleDateString() : "—"}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-700 pt-3 text-[11px] text-zinc-400">
              <span>Role: {scannedUser.status === "approved" ? "commuter" : scannedUser.status}</span>
              <span>Status: {scannedUser.status}</span>
            </div>
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
          <div className="mt-8 w-full max-w-sm rounded-3xl border border-red-700/70 bg-gradient-to-br from-zinc-800 to-zinc-900 p-5 shadow-[0_0_30px_rgba(220,38,38,0.5)] text-left">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-red-400">Telangana RTC</p>
                <h3 className="mt-1 text-xl font-extrabold text-white">eBusPass ID</h3>
              </div>
              <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase bg-red-600 text-white shadow-lg">
                Invalid
              </span>
            </div>
            <div className="mt-5 space-y-1 text-sm text-zinc-200">
              <p><span className="text-zinc-400">Name:</span> {scannedUser.name}</p>
              <p><span className="text-zinc-400">Phone:</span> {scannedUser.phone || "—"}</p>
              <p><span className="text-zinc-400">College:</span> {scannedUser.college || "—"}</p>
              <p className="truncate"><span className="text-zinc-400">Pass ID:</span> {scannedUser.userId}</p>
              <p><span className="text-zinc-400">Approval:</span> {scannedUser.status}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-700 pt-3 text-[11px] text-zinc-400">
              <span>Active: {scannedUser.isActive ? "Yes" : "No"}</span>
              <span>Status: {scannedUser.status}</span>
            </div>
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
        <CurrentUserBanner />
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
          <Link href="/conductor" className="text-emerald-400 underline">Back to Conductor Page</Link>
        </p>
      </div>
    </RoleGuard>
  );
}