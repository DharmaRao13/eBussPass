"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

type ScanOutcome = "idle" | "scanning" | "valid" | "expired" | "error";

export default function ConductorScanPage() {
  const [outcome, setOutcome] = useState<ScanOutcome>("scanning");
  const [message, setMessage] = useState<string | null>(null);
  const lastSent = useRef<string>("");
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      const data = (await res.json()) as { status?: string };
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
    lastSent.current = "";
  }, []);

  if (outcome === "valid") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-600 text-white">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/90 bg-emerald-500 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-16 w-16" aria-hidden>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-2xl font-bold tracking-wide">VALID</p>
        <p className="mt-2 text-emerald-100">Pass accepted</p>
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-14 w-14" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-2xl font-bold tracking-wide">EXPIRED</p>
        <p className="mt-2 text-red-100">Pass not valid</p>
        <button type="button" onClick={resumeScan} className="mt-10 rounded-full bg-white px-8 py-3 text-sm font-semibold text-red-700 shadow">
          Scan again
        </button>
      </div>
    );
  }

  if (outcome === "error") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900 px-6 text-center text-white">
        <p className="mb-2 text-lg font-semibold">Something went wrong</p>
        <p className="mb-8 text-sm text-zinc-400">{message}</p>
        <button type="button" onClick={resumeScan} className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-900">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Conductor scanner</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Point the camera at a commuter QR code</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-lg dark:border-zinc-800">
        <Scanner
          onScan={(result) => {
            if (result && result.length > 0) {
              validatePayload(result[0].rawValue);
            }
          }}
          onError={(error) =>
            console.error("Scanner Error:", error instanceof Error ? error.message : error)
          }
        />
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Allow camera access when prompted. Results are checked against the server.
      </p>

      <p className="mt-8 text-center text-sm">
        <Link href="/" className="text-emerald-700 underline dark:text-emerald-400">
          Home
        </Link>
      </p>
    </div>
  );
}