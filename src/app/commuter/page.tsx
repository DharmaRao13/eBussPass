"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase"; 

export default function CommuterDashboard() {
  const [userDoc, setUserDoc] = useState<any>(null);
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
        setUserDoc(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid, db]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading...</div>;

  // Sign In Screen (Matches Home Page Theme)
  if (!uid) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Telangana RTC</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">eBussPass</h1>
          <p className="text-zinc-400 text-sm max-w-[250px] mx-auto">Please sign in to access your digital commuter dashboard.</p>
        </div>
        <Link href="/login" className="bg-emerald-500 text-black px-10 py-3 rounded-full font-bold hover:bg-emerald-400 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const isExpired = userDoc?.expiryDate ? userDoc.expiryDate.toDate().getTime() <= Date.now() : true;
  const isValid = userDoc?.isActive && !isExpired;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="text-emerald-500 text-xs font-bold uppercase tracking-widest hover:text-emerald-400">
          ← Home
        </Link>
        <button onClick={handleLogout} className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-red-400 transition-colors">
          Sign Out
        </button>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        
        {/* Profile Card */}
        <div className="flex items-center gap-4 bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
          <div className="h-14 w-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-emerald-500">
            {userDoc?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="font-bold text-white">{userDoc?.name || "Commuter"}</h2>
            <p className="text-xs text-zinc-500">{userDoc?.phone || "No Phone Number"}</p>
            <p className="text-xs text-zinc-500">{userDoc?.email || "No Email"}</p>
            <p className="text-xs text-zinc-500">{userDoc?.role || "No Role"}</p>
            <p className="text-xs text-zinc-500">{userDoc?.college || "No College"}</p>
          </div>
        </div>

        {/* Pass Status Card */}
        <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 space-y-4">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pass Status</p>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="font-bold text-lg">Student Pass</p>
              <p className="text-[10px] text-zinc-500">
                Expires: {userDoc?.expiryDate?.toDate().toLocaleDateString()}
              </p>
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg ${
              isValid ? "bg-emerald-500 text-black" : "bg-red-600 text-white"
            }`}>
              {isValid ? "Active" : "Inactive"}
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800 flex flex-col items-center gap-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Identification</p>
          
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <QRCodeSVG value={uid || ""} size={180} />
          </div>

          <p className="text-[9px] text-center text-zinc-500 leading-relaxed max-w-[200px]">
            Show this code to the conductor for instant validation via the eBussPass scanner.
          </p>
        </div>

      </div>
    </div>
  );
}