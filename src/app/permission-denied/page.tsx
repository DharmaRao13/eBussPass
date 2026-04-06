import Link from "next/link";

export default function PermissionDeniedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Permission Denied</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        You do not have access to this page with your current role.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">
          Go to Login
        </Link>
        <Link href="/" className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold">
          Home
        </Link>
      </div>
    </div>
  );
}
