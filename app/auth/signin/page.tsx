"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/blog-create";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/blog-create");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Blog admin
      </p>
      <h1 className="mt-2 font-display text-3xl text-text-primary">
        Sign in
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        Use the admin email and password from your environment (not shared publicly).
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Email
          </span>
          <input
            required
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lariyaharsh88@gmail.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Password
          </span>
          <input
            required
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 font-mono text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-3 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center font-mono text-xs text-text-muted">
        <Link href="/blogs" className="text-accent hover:underline">
          ← Back to blog
        </Link>
      </p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16 font-mono text-sm text-text-muted">
          Loading…
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
