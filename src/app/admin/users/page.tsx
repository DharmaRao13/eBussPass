import Link from "next/link";
import { UsersAdminTable } from "@/components/admin/UsersAdminTable";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Admin · Users</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage commuter profiles in the <code className="text-xs">users</code> collection.
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
  );
}
