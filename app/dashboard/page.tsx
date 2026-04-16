"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    let dead = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        setSignedIn(Boolean(token));
        if (!token) {
          setError("Please login to view your dashboard history.");
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
        if (!dead) setRows(Array.isArray(payload.items) ? payload.items : []);
      } catch (e) {
        if (!dead) setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <p className="font-mono text-xs">
        <Link href="/" className="text-text-muted hover:text-accent">
          ← Home
        </Link>
      </p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border/80 bg-surface/50 p-4 lg:sticky lg:top-6 lg:h-fit">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Dashboard</p>
          <nav className="mt-3 space-y-1">
            {[
              { href: "#overview", label: "Overview" },
              { href: "#quick-actions", label: "Quick actions" },
              { href: "#recent-activity", label: "Recent activity" },
              { href: "#insights", label: "Insights" },
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
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Last run</p>
            <p className="mt-1 font-serif text-sm text-text-secondary">{lastRun}</p>
          </div>
        </aside>
        <section className="space-y-5">
          <header id="overview" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">User Dashboard</p>
            <h1 className="mt-2 font-display text-3xl text-text-primary">Content command center</h1>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              Track publishing momentum, reopen recent work, and launch your next high-intent article in one place.
            </p>
          </header>

          <section id="quick-actions" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-text-primary">Quick actions</h2>
              <span className="font-mono text-[11px] text-text-muted">Start in under 10 seconds</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/seo-agent?try=1", label: "Generate new article", meta: "Start guided workflow" },
                { href: "/free-tools/keyword-clustering", label: "Cluster keywords", meta: "Plan topic map" },
                { href: "/free-tools/ai-search-grader", label: "Grade search visibility", meta: "Benchmark discoverability" },
                { href: "/pricing", label: "Upgrade plan", meta: "Unlock Pro features" },
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
                You are not logged in.
              </p>
              <Link
                href="/login?next=/dashboard"
                className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 font-mono text-xs text-background"
              >
                Login to open dashboard
              </Link>
            </div>
          ) : null}

          <section id="insights" className="rounded-2xl border border-border/80 bg-surface/50 p-5">
            <h2 className="font-display text-2xl text-text-primary">Insights</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            </div>
          </section>

          {loading ? (
            <p className="font-mono text-sm text-text-muted">Loading history...</p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {!loading && !error && rows.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-surface/60 p-4">
              <p className="font-serif text-sm text-text-secondary">
                No activity yet. Start your first run to unlock recent activity and analytics.
              </p>
              <Link
                href="/seo-agent?try=1"
                className="mt-3 inline-flex rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background"
              >
                Create first article
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
                  Generate another article →
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
                          Source link
                        </a>
                      ) : null}
                      <Link
                        href={row.dashboardLink}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        Open details
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
