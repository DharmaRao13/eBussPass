"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import type { UserProfile } from "@/types/ebuspass";
import { getFirebaseDb } from "@/lib/firebase";

export type UserRow = { id: string } & UserProfile;

export function UsersAdminTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [searchId, setSearchId] = useState("");

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

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const toggleUserStatus = async (userId: string, currentIsActive: boolean) => {
    setBusyIds((prev) => new Set(prev).add(userId));
    setError(null);

    try {
      const db = getFirebaseDb();
      const newIsActive = !currentIsActive;
      const updates: any = { isActive: newIsActive };

      if (newIsActive) {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        updates.expiryDate = Timestamp.fromDate(futureDate);
      }

      await updateDoc(doc(db, "users", userId), updates);

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
    } catch (e) {
      console.error(e);
      setError("Update failed. Check permissions.");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const approvePendingUser = async (userId: string) => {
    setBusyIds((prev) => new Set(prev).add(userId));
    setError(null);

    try {
      const db = getFirebaseDb();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await updateDoc(doc(db, "users", userId), {
        isActive: true,
        status: "approved",
        expiryDate: Timestamp.fromDate(futureDate),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: true, status: "approved" } : u)),
      );
    } catch (e) {
      console.error(e);
      setError("Verification failed.");
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

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status !== "pending");
  const searchQuery = searchId.trim().toLowerCase();
  const searchedUser = searchQuery
    ? users.find((u) => u.id.toLowerCase() === searchQuery)
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">User Management</h2>
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

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Search commuter by User ID</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter exact user ID"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => setSearchId(searchId.trim())}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Fetch Details
          </button>
        </div>
        {searchQuery && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
            {searchedUser ? (
              <div className="space-y-1 text-zinc-700 dark:text-zinc-200">
                <p><span className="font-semibold">User ID:</span> {searchedUser.id}</p>
                <p><span className="font-semibold">Name:</span> {searchedUser.name || "—"}</p>
                <p><span className="font-semibold">Phone:</span> {searchedUser.phone || "—"}</p>
                <p><span className="font-semibold">Email:</span> {searchedUser.email || "—"}</p>
                <p><span className="font-semibold">College:</span> {searchedUser.college || "—"}</p>
                <p><span className="font-semibold">Role:</span> {searchedUser.role || "—"}</p>
                <p><span className="font-semibold">Status:</span> {searchedUser.status || "—"}</p>
                <p><span className="font-semibold">Active:</span> {searchedUser.isActive ? "Yes" : "No"}</p>
              </div>
            ) : (
              <p className="text-red-600 dark:text-red-400">No commuter found for this user ID.</p>
            )}
          </div>
        )}
      </div>

      {/* 1. Pending Approvals Table */}
      <div className="overflow-x-auto rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
        <div className="px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-300">
          Pending Approvals ({pendingUsers.length})
        </div>
        <table className="min-w-full divide-y divide-amber-200 text-left text-sm dark:divide-amber-900">
          <thead className="bg-amber-100/70 dark:bg-amber-900/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">User ID</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Phone</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Institute</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 dark:divide-amber-900/50">
            {pendingUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No pending commuters.
                </td>
              </tr>
            ) : (
              pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-amber-100/40 dark:hover:bg-amber-900/20">
                  <td className="px-4 py-3 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 group flex items-center gap-2">
                    <span>{user.id}</span>
                    <button 
                      onClick={() => handleCopy(user.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-emerald-500 transition-all"
                      title="Copy ID"
                    >
                      {copyStatus === user.id ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{user.phone || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{user.college || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={busyIds.has(user.id)}
                      onClick={() => void approvePendingUser(user.id)}
                      className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {busyIds.has(user.id) ? "..." : "Verify & Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 2. All Users Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-4 py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          All Users ({approvedUsers.length})
        </div>
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">User ID</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Phone</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Role</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Active</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {approvedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 group flex items-center gap-2">
                  <span>{user.id}</span>
                  <button 
                    onClick={() => handleCopy(user.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-emerald-500 transition-all"
                    title="Copy ID"
                  >
                    {copyStatus === user.id ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{user.name || "—"}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.phone || "—"}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 capitalize">{user.role || "—"}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 capitalize">{user.status || "—"}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={busyIds.has(user.id)}
                    onClick={() => void toggleUserStatus(user.id, !!user.isActive)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors ${
                      user.isActive
                        ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                    }`}
                  >
                    {busyIds.has(user.id) ? "..." : user.isActive ? "Deactivate" : "Activate"}
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