"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/seo-agent";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const base = window.location.origin;
    const n = nextPath.startsWith("/") ? nextPath : "/seo-agent";
    return `${base}/auth/callback?next=${encodeURIComponent(n)}`;
  }, [nextPath]);

  async function sendMagicLink() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (authError) throw authError;
      setMessage(email.trim().toLowerCase());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /rate limit/i.test(msg)
          ? "We've sent too many sign-in emails in the last hour. Please wait a few minutes and try again — or use the link from an earlier email if you still have it."
          : msg || "We couldn't send the sign-in link. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkSessionNow() {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (data.session) {
        router.push(nextPath.startsWith("/") ? nextPath : "/seo-agent");
        router.refresh();
      } else {
        setError("You're not signed in yet — open the link in the email first, then come back here.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session check failed.");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 md:px-6">
      <h1 className="font-display text-3xl text-text-primary">Sign in or create a free account</h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        Enter your email and we&apos;ll send you a sign-in link — no password needed. New here? The same link
        creates your account, and your first 5 articles are free.
      </p>

      {message ? (
        <section className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="font-display text-xl text-text-primary">Check your inbox</p>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            We sent a sign-in link to <span className="font-semibold text-text-primary">{message}</span>. Open it on
            this device and you&apos;ll come straight back here, signed in. It can take a minute — check spam too.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void checkSessionNow()}
              className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
            >
              I&apos;ve opened the link
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setError(null);
              }}
              className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
            >
              Use a different email
            </button>
          </div>
        </section>
      ) : (
        <form
          className="mt-8 space-y-4 rounded-xl border border-border bg-surface/70 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMagicLink();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-primary">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-mono text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-text-muted">
        <Link href={nextPath} className="text-accent hover:underline">
          ← Go back
        </Link>
      </p>

      {process.env.NODE_ENV === "development" ? (
        <p className="mt-6 font-mono text-[11px] text-text-muted">
          Dev note: keep <code className="text-accent">npm run dev</code> running before you open the link in the
          email.
        </p>
      ) : null}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16 font-mono text-sm text-text-muted">
          Loading…
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
