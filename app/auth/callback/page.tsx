"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function safeNextParam(raw: string | null): string {
  if (raw?.startsWith("/")) return raw;
  return "/seo-agent";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"working" | "done" | "error">("working");
  const [detail, setDetail] = useState<string | null>(null);
  const [nextForLink, setNextForLink] = useState("/seo-agent");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (typeof window === "undefined") return;

      const pageUrl = new URL(window.location.href);
      const nextPath = safeNextParam(pageUrl.searchParams.get("next"));
      setNextForLink(nextPath);

      const oauthError = pageUrl.searchParams.get("error");
      const oauthDesc = pageUrl.searchParams.get("error_description");
      if (oauthError) {
        setPhase("error");
        setDetail(
          oauthDesc?.replace(/\+/g, " ") ||
            oauthError ||
            "Sign-in was cancelled or failed.",
        );
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const code = pageUrl.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        let { data } = await supabase.auth.getSession();
        if (!data.session) {
          await new Promise((r) => setTimeout(r, 200));
          ({ data } = await supabase.auth.getSession());
        }
        if (!data.session) {
          await new Promise((r) => setTimeout(r, 400));
          ({ data } = await supabase.auth.getSession());
        }

        if (cancelled) return;

        if (!data.session) {
          setPhase("error");
          setDetail(
            "Could not finish login. If you use localhost, run npm run dev before opening the email link.",
          );
          return;
        }

        setPhase("done");
        router.replace(nextPath);
        router.refresh();
      } catch (e) {
        if (!cancelled) {
          setPhase("error");
          setDetail(e instanceof Error ? e.message : "Authentication failed.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-md px-4 py-16 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Signing you in
      </p>
      <h1 className="mt-2 font-display text-2xl text-text-primary">
        {phase === "working" ? "Completing login…" : null}
        {phase === "done" ? "Redirecting…" : null}
        {phase === "error" ? "Login could not complete" : null}
      </h1>
      {phase === "working" ? (
        <p className="mt-3 font-serif text-sm text-text-secondary">
          Finishing secure session from your email link.
        </p>
      ) : null}
      {phase === "error" && detail ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
          {detail}
        </p>
      ) : null}
      {phase === "error" ? (
        <div className="mt-6 space-y-3 font-serif text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Local dev:</strong> start the app with{" "}
            <code className="rounded bg-surface px-1 font-mono text-xs">npm run dev</code>{" "}
            before clicking the email link, or the browser will show “connection refused”
            for <code className="font-mono text-xs">localhost</code>.
          </p>
          <p>
            <strong className="text-text-primary">Production:</strong> in Supabase →
            Authentication → URL configuration, set <strong>Site URL</strong> to your live
            domain and add{" "}
            <code className="rounded bg-surface px-1 font-mono text-[11px]">
              https://your-domain.com/auth/callback
            </code>{" "}
            under Redirect URLs.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(nextForLink)}`}
            className="inline-block rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background"
          >
            Back to login
          </Link>
        </div>
      ) : null}
    </main>
  );
}
