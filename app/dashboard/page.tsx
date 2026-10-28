"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Row = {
  id: string;
  title: string;
  topic: string;
  primaryKeyword: string | null;
  sourceUrl: string | null;
  wordCount: number;
  createdAt: string;
  dashboardLink: string;
};

/** Fallback until /api/usage answers; must match MONTHLY_RUN_LIMITS.free in lib/usage-guard.ts. */
const FREE_LOGGED_RUN_LIMIT = 5;

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [unlimited, setUnlimited] = useState(false);
  const [usage, setUsage] = useState<{
    plan: string;
    remaining: number;
    limit: number;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      setSignedIn(Boolean(token));
      if (!token) {
        setRows([]);
        return;
      }
      void fetch("/api/config", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d: { unlimited?: boolean }) =>
          setUnlimited(d?.unlimited === true),
        )
        .catch(() => setUnlimited(false));
      void fetch("/api/usage", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((u: { plan: string; remaining: number; limit: number } | null) =>
          setUsage(u),
        )
        .catch(() => setUsage(null));
      const res = await fetch("/api/user-articles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await parseJsonSafe<{
        items?: Row[];
        error?: string;
      }>(res)) || { error: "" };
      if (!res.ok) {
        throw new Error(
          payload.error ||
            `Dashboard API failed (HTTP ${res.status}). If this is a fresh deploy, run prisma migrate deploy.`,
        );
      }
      setRows(Array.isArray(payload.items) ? payload.items : []);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please refresh.",
      );
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalWords = rows.reduce((sum, row) => sum + row.wordCount, 0);
  // Server-side monthly quota (/api/usage) when available; otherwise estimate from saved articles.
  const freeLeft = usage
    ? usage.remaining
    : Math.max(0, FREE_LOGGED_RUN_LIMIT - rows.length);
  const leftLabel =
    usage && usage.plan !== "free"
      ? `Articles left this month (${usage.plan})`
      : "Free articles left";
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="skeleton h-8 w-48 rounded-md" />
        <div className="skeleton mt-6 h-24 w-full rounded-xl" />
        <div className="skeleton mt-3 h-24 w-full rounded-xl" />
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 md:px-6">
        <h1 className="font-display text-3xl text-text-primary">My articles</h1>
        <p className="mt-3 font-serif text-sm text-text-secondary">
          Sign in to see the articles you&apos;ve generated. New here? Signing
          in creates a free account with 5 free articles.
        </p>
        <Link
          href="/login?next=/dashboard"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-background hover:opacity-90"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-text-primary">My articles</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/projects"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 font-mono text-sm text-text-secondary hover:border-accent hover:text-accent"
          >
            Projects &amp; brand voice
          </Link>
          <Link
            href="/seo-agent"
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-background hover:opacity-90"
          >
            + Write a new article
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[
          ["Articles", rows.length.toLocaleString()],
          ["Words written", totalWords.toLocaleString()],
          [leftLabel, unlimited ? "Unlimited" : freeLeft.toString()],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border/80 bg-surface/50 p-4"
          >
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="mt-1 font-display text-2xl text-text-primary">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {!unlimited && freeLeft === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">
          You&apos;ve used your free articles.{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            See plans
          </Link>
          .
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4"
        >
          <p className="text-sm text-red-200">
            We couldn&apos;t load your articles. Please try again.
          </p>
          <button
            type="button"
            disabled={retrying}
            onClick={() => {
              setRetrying(true);
              void loadDashboard();
            }}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {retrying ? "Retrying…" : "Try again"}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border/80 bg-surface/40 px-5 py-10 text-center">
          <p className="font-display text-lg text-text-primary">
            No articles yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
            Enter a keyword in the article writer and your finished articles
            will be listed here.
          </p>
          <Link
            href="/seo-agent"
            className="mt-4 inline-block font-mono text-sm text-accent hover:underline"
          >
            Write your first article →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.dashboardLink}
                className="block rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/60"
              >
                <p className="font-display text-lg text-text-primary">
                  {row.title}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatDate(row.createdAt)} · {row.wordCount.toLocaleString()}{" "}
                  words
                  {row.primaryKeyword
                    ? ` · keyword: ${row.primaryKeyword}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
