"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types/ebuspass";

export function CurrentUserBanner() {
  const [name, setName] = useState<string>("User");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserProfile["role"] | "unknown">("unknown");
  const router = useRouter();

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex w-max max-w-[90vw] items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-1">
        <button onClick={() => router.back()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 transition" title="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <Link href="/" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50 transition" title="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </Link>
      </div>
      <div className="hidden sm:block">
        <p className="text-xs font-semibold text-zinc-100 truncate max-w-[120px]">{name}</p>
        <p className="text-[10px] text-zinc-400 truncate max-w-[120px]">{email || "No email"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-l border-zinc-700 pl-3">
        <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          {role}
        </span>
        <button
          type="button"
          onClick={() => {
            void signOut(getFirebaseAuth());
            window.location.href = "/";
          }}
          className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
