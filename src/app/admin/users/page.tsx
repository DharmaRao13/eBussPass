"use client";

import Link from "next/link";
import { UsersAdminTable } from "@/components/admin/UsersAdminTable";
import { CurrentUserBanner } from "@/components/auth/CurrentUserBanner";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">
        <CurrentUserBanner />
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Admin · Users</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Review pending commuter registrations and manage all users.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Home
          </Link>
        </header>
        <UsersAdminTable />
      </div>
    </RoleGuard>
  );
}
