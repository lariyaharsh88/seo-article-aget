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
  const [phone, setPhone] = useState("");
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
      setMessage("Magic link sent. Open your email and continue.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPhoneOtp() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (authError) throw authError;
      setMessage("Phone OTP sent. Complete verification from your OTP flow.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send phone OTP.");
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
        setError("No active session yet. Open your magic link first.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session check failed.");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Supabase Auth
      </p>
      <h1 className="mt-2 font-display text-3xl text-text-primary">
        Login to continue
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        Use email magic link (recommended) or phone OTP. After login, article tools
        will personalize to your account.
      </p>
      <p className="mt-2 font-mono text-[11px] text-text-muted">
        Local testing: keep <code className="text-accent">npm run dev</code> running before you
        open the link in the email (otherwise localhost will refuse the connection).
      </p>

      <section className="mt-8 space-y-4 rounded-xl border border-border bg-surface/70 p-4">
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Email OTP (Magic Link)
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => void sendMagicLink()}
          disabled={loading || !email.trim()}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-mono text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </section>

      <section className="mt-4 space-y-4 rounded-xl border border-border bg-surface/70 p-4">
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Phone OTP (optional)
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => void sendPhoneOtp()}
          disabled={loading || !phone.trim()}
          className="w-full rounded-lg border border-accent/50 bg-accent/10 px-4 py-2.5 font-mono text-sm font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          Send Phone OTP
        </button>
      </section>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void checkSessionNow()}
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          I already clicked the magic link
        </button>
        <Link
          href={nextPath}
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Back
        </Link>
      </div>
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
