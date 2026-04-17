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

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      setSignedIn(Boolean(token));
      if (!token) {
        setRows([]);
        setError("Please log in to view your dashboard.");
        return;
      }
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
      setError(e instanceof Error ? e.message : "Something went wrong. Please refresh.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalWords = rows.reduce((sum, row) => sum + row.wordCount, 0);
  const avgWords = rows.length ? Math.round(totalWords / rows.length) : 0;
  const lastRun = rows[0]?.createdAt
    ? new Date(rows[0].createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "No runs yet";
  const uniqueTopics = new Set(rows.map((r) => r.topic.trim().toLowerCase()).filter(Boolean)).size;
  const thisWeekRuns = rows.filter((row) => {
    const now = Date.now();
    const created = new Date(row.createdAt).getTime();
    return Number.isFinite(created) && now - created <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const estimatedCreditsLeft = Math.max(0, FREE_LOGGED_RUN_LIMIT - thisWeekRuns);
  const statSkeleton = (
    <div className="rounded-xl border border-border/80 bg-background/35 p-4">
      <div className="skeleton h-3 w-24 rounded-md" />
      <div className="skeleton mt-2 h-8 w-16 rounded-md" />
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <p className="font-mono text-xs">
        <Link href="/" className="text-text-muted hover:text-accent">
          ← Home
        </Link>
      </p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border/80 bg-surface/50 p-4 lg:sticky lg:top-6 lg:h-fit">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Your dashboard</p>
          <nav className="mt-3 space-y-1">
            {[
              { href: "#overview", label: "Overview" },
              { href: "#quick-actions", label: "Quick actions" },
              { href: "#recent-activity", label: "Recent activity" },
              { href: "#insights", label: "Usage stats" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-lg border border-transparent px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-border hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 rounded-lg border border-border/80 bg-background/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Latest run</p>
            <p className="mt-1 font-serif text-sm text-text-secondary">{lastRun}</p>
          </div>
        </aside>
        <section className="space-y-5">
          <header id="overview" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Dashboard overview</p>
            <h1 className="mt-2 font-display text-3xl text-text-primary">Manage your content workflow</h1>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              Track progress, reopen recent work, and launch your next article from one place.
            </p>
          </header>

          <section className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Do this first</p>
                <h2 className="mt-1 font-display text-2xl text-text-primary">Generate your next article</h2>
                <p className="mt-1 font-serif text-sm text-text-secondary">
                  Start a guided run, then optimize and share. This is your fastest next step.
                </p>
              </div>
              <Link
                href="/seo-agent?try=1"
                className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
              >
                Generate article
              </Link>
            </div>
          </section>

          <section id="quick-actions" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-text-primary">Quick actions</h2>
              <span className="font-mono text-[11px] text-text-muted">Pick one and continue</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/seo-agent?try=1", label: "Generate article", meta: "Recommended first" },
                { href: "/free-tools/keyword-clustering", label: "Cluster keywords", meta: "Plan topic map" },
                { href: "/free-tools/ai-search-grader", label: "Grade search visibility", meta: "Benchmark discoverability" },
                { href: "/pricing", label: "Upgrade to Pro", meta: "Unlock advanced tools" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border/80 bg-background/35 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/70"
                >
                  <p className="font-mono text-xs text-accent">{item.label}</p>
                  <p className="mt-1 font-serif text-xs text-text-muted">{item.meta}</p>
                </Link>
              ))}
            </div>
          </section>

          {!signedIn ? (
            <div className="rounded-xl border border-border bg-surface/70 p-4">
              <p className="font-serif text-sm text-text-secondary">
                You&apos;re not logged in yet.
              </p>
              <Link
                href="/login?next=/dashboard"
                className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 font-mono text-xs text-background"
              >
                Log in to continue
              </Link>
            </div>
          ) : null}

          <section id="insights" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-text-primary">Usage stats</h2>
              <span className="font-mono text-[11px] text-text-muted">See your current progress</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div key={`stat-skeleton-${idx}`}>{statSkeleton}</div>
                  ))
                : (
                  <>
              <div className="rounded-xl border border-border/80 bg-background/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Total articles</p>
                <p className="mt-1 font-display text-3xl text-text-primary">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-background/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Total words</p>
                <p className="mt-1 font-display text-3xl text-text-primary">{totalWords.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-background/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Avg words/article</p>
                <p className="mt-1 font-display text-3xl text-text-primary">{avgWords.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-background/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Unique topics</p>
                <p className="mt-1 font-display text-3xl text-text-primary">{uniqueTopics}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-background/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">This week runs</p>
                <p className="mt-1 font-display text-3xl text-text-primary">{thisWeekRuns}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-background/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Est. free credits left</p>
                <p className="mt-1 font-display text-3xl text-text-primary">{estimatedCreditsLeft}</p>
              </div>
                  </>
                )}
            </div>
          </section>

          {loading ? (
            <div className="rounded-xl border border-border/80 bg-surface/60 p-4">
              <p className="font-mono text-sm text-text-muted">Loading your dashboard...</p>
              <p className="mt-1 font-mono text-[11px] text-text-muted">
                We&apos;re pulling your latest activity and usage stats.
              </p>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-3">
              <p className="font-mono text-sm text-red-200">{error}</p>
              <p className="mt-1 font-mono text-[11px] text-red-100">
                Try again now. If this keeps happening, log out and back in once.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRetrying(true);
                    setLoading(true);
                    void loadDashboard();
                  }}
                  disabled={retrying}
                  className="rounded-md border border-red-300/40 bg-red-500/10 px-3 py-1.5 font-mono text-xs text-red-100 hover:bg-red-500/20 disabled:opacity-40"
                >
                  {retrying ? "Retrying..." : "Retry"}
                </button>
                <Link
                  href="/login?next=/dashboard"
                  className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  Re-login
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && !error && rows.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-surface/60 p-4">
              <p className="font-serif text-sm text-text-secondary">
                No activity yet. Generate your first article to unlock activity and stats.
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-muted">
                Tip: start with one primary keyword for the fastest first result.
              </p>
              <Link
                href="/seo-agent?try=1"
                className="mt-3 inline-flex rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background"
              >
                Generate your first article
              </Link>
            </div>
          ) : null}

          {rows.length > 0 ? (
            <section id="recent-activity" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl text-text-primary">Recent activity</h2>
                <Link
                  href="/seo-agent"
                  className="font-mono text-xs text-accent underline-offset-2 hover:underline"
                >
                  Generate another article
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-border bg-background/35 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-xl text-text-primary">{row.title}</h3>
                      <span className="font-mono text-[11px] text-text-muted">
                        {new Date(row.createdAt).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        IST
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-sm text-text-secondary">{row.topic}</p>
                    <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-text-muted">
                      <span>Words: {row.wordCount}</span>
                      <span>Primary: {row.primaryKeyword || "-"}</span>
                      {row.sourceUrl ? (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline-offset-2 hover:underline"
                        >
                          Open source
                        </a>
                      ) : null}
                      <Link
                        href={row.dashboardLink}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        Open article details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
