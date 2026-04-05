"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type AuthError,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

/**
 * Minimal commuter sign-in (email/password + optional Google for demos).
 * Create users in Firebase Console or enable Email/Password provider.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mapAuthError = (e: unknown) => {
    const code = (e as AuthError)?.code;
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      return "Invalid email or password.";
    }
    if (code === "auth/user-not-found") return "No account for this email.";
    if (code === "auth/popup-closed-by-user") return "Sign-in popup was closed.";
    return (e as Error)?.message || "Sign-in failed.";
  };

  const onEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      router.push("/commuter");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      router.push("/commuter");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-2 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Sign in
      </h1>
      <p className="mb-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Commuter access to eBussPass
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <form onSubmit={onEmailSignIn} className="flex flex-col gap-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            required
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Please wait…" : "Sign in with email"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={busy}
        className="rounded-full border border-zinc-300 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/" className="text-emerald-700 underline dark:text-emerald-400">
          Back to home
        </Link>
      </p>
    </div>
  );
}
