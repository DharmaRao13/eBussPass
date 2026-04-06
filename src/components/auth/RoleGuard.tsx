"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types/ebuspass";

type Role = UserProfile["role"];

type RoleGuardProps = {
  allowedRoles: Role[];
  children: React.ReactNode;
};

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const expected = useMemo(() => new Set(allowedRoles), [allowedRoles]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = (snap.data() as Partial<UserProfile> | undefined)?.role;
        if (!role || !expected.has(role as Role)) {
          router.replace("/permission-denied");
          return;
        }
        setAllowed(true);
        setReady(true);
      } catch (error) {
        console.error(error);
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [expected, pathname, router]);

  if (!ready || !allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-zinc-500">
        Checking permissions...
      </div>
    );
  }

  return <>{children}</>;
}
