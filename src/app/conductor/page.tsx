"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types/ebuspass";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CurrentUserBanner } from "@/components/auth/CurrentUserBanner";

type ScanHistoryItem = {
  scannedAt: string;
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

const HISTORY_KEY = "ebuspass:last_scans";

export default function ConductorDashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUid(u?.uid || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const db = getFirebaseDb();
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ScanHistoryItem[];
      setHistory(parsed);
    } catch {
      setHistory([]);
    }
  }, []);

  const lastScanned = useMemo(() => history[0] ?? null, [history]);

  const clearHistory = () => {
    window.localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  return (
    <RoleGuard allowedRoles={["conductor", "admin"]}>
      <div className="mx-auto min-h-[80vh] max-w-4xl px-4 pt-8 pb-24">
        <CurrentUserBanner />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Conductor Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Conductor details, last scanned commuter, and quick scan access.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Conductor Details</h2>
            <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
              <p><span className="font-semibold">Name:</span> {profile?.name || "—"}</p>
              <p><span className="font-semibold">Phone:</span> {profile?.phone || "—"}</p>
              <p><span className="font-semibold">Email:</span> {profile?.email || "—"}</p>
              <p><span className="font-semibold">Role:</span> {profile?.role || "conductor"}</p>
            </div>
            <Link
              href="/conductor/scan"
              className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Click to Scan QR
            </Link>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Last Scanned Commuter</h2>
            {lastScanned?.user ? (
              <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
                <p><span className="font-semibold">Name:</span> {lastScanned.user.name}</p>
                <p><span className="font-semibold">Phone:</span> {lastScanned.user.phone}</p>
                <p><span className="font-semibold">User ID:</span> {lastScanned.user.userId}</p>
                <p><span className="font-semibold">Status:</span> {lastScanned.status}</p>
                <p><span className="font-semibold">Scanned At:</span> {new Date(lastScanned.scannedAt).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No scans yet.</p>
            )}
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent Scan History</h2>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No history available.</p>
            ) : (
              history.slice(0, 8).map((item, idx) => (
                <div
                  key={`${item.scannedAt}-${idx}`}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                >
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">
                    {item.user?.name || "Unknown commuter"} · {item.status}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.user?.userId || "—"} · {new Date(item.scannedAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
