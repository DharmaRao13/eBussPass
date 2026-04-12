import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <main className="w-full max-w-lg text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Telangana RTC
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          eBusPass
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Digitized public transit pass — commuter QR and conductor validation (MVP).
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/commuter"
            className="rounded-full bg-emerald-600 px-8 py-3 text-center text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Commuter dashboard
          </Link>
          <Link
            href="/conductor"
            className="rounded-full border border-zinc-300 bg-white px-8 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Conductor dashboard
          </Link>
        </div>
        <p className="mt-8 text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-emerald-700 underline dark:text-emerald-400">
            Commuter sign-in
          </Link>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/register" className="mr-3 font-medium text-emerald-700 underline dark:text-emerald-400">
            New commuter registration
          </Link>
          <Link href="/admin/users" className="font-medium text-emerald-700 underline dark:text-emerald-400">
            Admin dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
