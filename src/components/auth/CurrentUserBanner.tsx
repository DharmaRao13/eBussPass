"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types/ebuspass";

export function CurrentUserBanner() {
  const [name, setName] = useState<string>("User");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserProfile["role"] | "unknown">("unknown");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setEmail(user.email || "");
      const db = getFirebaseDb();
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data() as Partial<UserProfile> | undefined;
      setName(data?.name || user.displayName || "User");
      setRole((data?.role as UserProfile["role"] | undefined) || "unknown");
    });
    return () => unsub();
  }, []);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-zinc-100">{name}</p>
        <p className="text-xs text-zinc-400">{email || "No email"}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-semibold uppercase text-emerald-300">
          {role}
        </span>
        <button
          type="button"
          onClick={() => void signOut(getFirebaseAuth())}
          className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
