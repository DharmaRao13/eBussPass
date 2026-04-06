"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import type { UserProfile } from "@/types/ebuspass";
import { getFirebaseDb } from "@/lib/firebase";

export type UserRow = { id: string } & UserProfile;

export function UsersAdminTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, "users"));
      const rows: UserRow[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as UserProfile),
      }));
      rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setUsers(rows);
    } catch (e) {
      console.error(e);
      setError("Could not load users. Check Firestore rules and network.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setBusyIds((prev) => new Set(prev).add(userId));

    try {
      const db = getFirebaseDb();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const newStatus = !currentStatus;

      await updateDoc(doc(db, "users", userId), {
        isActive: newStatus,
        expiryDate: newStatus ? Timestamp.fromDate(futureDate) : Timestamp.now(),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
      );
    } catch (error) {
      console.error(error);
      alert("Update failed!");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Loading users…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">All users</h2>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">User ID</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Phone</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Active</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="truncate px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">{user.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">{user.phone || "—"}</td>
                <td className="px-4 py-3 text-sm">
                  {user.isActive ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    disabled={busyIds.has(user.id)}
                    onClick={() => toggleUserStatus(user.id, !!user.isActive)}
                    className={`rounded px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors ${
                      user.isActive
                        ? "bg-red-600 hover:bg-red-700" 
                        : "bg-emerald-600 hover:bg-emerald-700"
                    } ${busyIds.has(user.id) ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {busyIds.has(user.id) ? "Loading..." : (user.isActive ? "Deactivate" : "Activate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}