"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase";
import { CurrentUserBanner } from "@/components/auth/CurrentUserBanner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { UserProfile } from "@/types/ebuspass";

export default function CommuterDashboard() {
  const [userDoc, setUserDoc] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserDoc(docSnap.data() as UserProfile);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid, db]);



  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading...</div>;

  // Login Redirect if not signed in
  if (!uid) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Telangana RTC</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">eBusPass</h1>
        </div>
        <Link href="/login" className="bg-emerald-500 text-black px-10 py-3 rounded-full font-bold hover:bg-emerald-400">
          Sign In
        </Link>
      </div>
    );
  }

  const isExpired = userDoc?.expiryDate ? userDoc.expiryDate.toDate().getTime() <= Date.now() : true;
  const isValid = userDoc?.isActive && !isExpired;
  const isPending = userDoc?.status === "pending";

  return (
    <RoleGuard allowedRoles={["commuter", "admin", "conductor"]}>
      <div className="min-h-screen bg-zinc-900 text-white p-6 pb-24 font-sans">
        <CurrentUserBanner />

        <div className="mx-auto max-w-md space-y-4">
          <div className="rounded-3xl border border-emerald-700/70 bg-gradient-to-br from-zinc-800 to-zinc-900 p-5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-400">Telangana RTC</p>
                <h3 className="mt-1 text-xl font-extrabold text-white">eBusPass ID</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                isValid ? "bg-emerald-500 text-black" : "bg-red-600 text-white"
              }`}>
                {isValid ? "Valid" : "Expired"}
              </span>
            </div>
            <div className="mt-5 space-y-1 text-sm text-zinc-200">
              <p><span className="text-zinc-400">Name:</span> {userDoc?.name || "Commuter"}</p>
              <p><span className="text-zinc-400">Phone:</span> {userDoc?.phone || "—"}</p>
              <p><span className="text-zinc-400">College:</span> {userDoc?.college || "—"}</p>
              <p className="truncate"><span className="text-zinc-400">Pass ID:</span> {uid}</p>
              <p><span className="text-zinc-400">Expires:</span> {userDoc?.expiryDate?.toDate().toLocaleDateString() || "N/A"}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-700 pt-3 text-[11px] text-zinc-400">
              <span>Role: {userDoc?.role || "commuter"}</span>
              <span>Status: {userDoc?.status || "pending"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-zinc-800 p-5 rounded-2xl border border-zinc-700">
            <div className="h-14 w-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-emerald-500">
              {userDoc?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="font-bold text-white text-left">{userDoc?.name || "Commuter"}</h2>
              <p className="text-xs text-zinc-400 text-left">{userDoc?.phone || "No Phone Number"}</p>
              <p className="text-xs text-zinc-400">{userDoc?.email || "No Email"}</p>
              <p className="text-xs text-zinc-400">Role: {userDoc?.role || "No Role"}</p>
              <p className="text-xs text-zinc-400">Institute: {userDoc?.college || "No College"}</p>
            </div>
          </div>

          {isPending && (
            <div className="rounded-2xl border border-amber-700 bg-amber-950/30 p-4 text-amber-300">
              Your account is pending admin verification. Your pass becomes valid after approval.
            </div>
          )}

          <div className="bg-zinc-800 p-6 rounded-[2rem] border border-zinc-700 space-y-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Pass Status</p>
            <div className="flex justify-between items-end">
              <div className="space-y-1 text-left">
                <p className="font-bold text-lg">Student Pass</p>
                <p className="text-[10px] text-zinc-400">
                  Expires: {userDoc?.expiryDate?.toDate().toLocaleDateString() || "N/A"}
                </p>
              </div>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg ${
                isValid ? "bg-emerald-500 text-black" : "bg-red-600 text-white"
              }`}>
                {isValid ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 p-8 rounded-[2rem] border border-zinc-700 flex flex-col items-center gap-6">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Your Identification</p>
            <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <QRCodeSVG value={uid || ""} size={180} />
            </div>
            <p className="text-[9px] text-center text-zinc-400 leading-relaxed max-w-[200px]">
              Show this code to the conductor for instant validation via the eBusPass scanner.
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}