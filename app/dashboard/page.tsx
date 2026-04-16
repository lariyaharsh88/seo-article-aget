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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <p className="font-mono text-xs">
        <Link href="/" className="text-text-muted hover:text-accent">
          ← Home
        </Link>
      </p>
      <header className="mt-4 border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          User Dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">Article history</h1>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          Your generated articles with quick links and basic details.
        </p>
      </header>

      {!signedIn ? (
        <div className="mt-6 rounded-xl border border-border bg-surface/70 p-4">
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

      {loading ? (
        <p className="mt-6 font-mono text-sm text-text-muted">Loading history...</p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <p className="mt-6 font-serif text-sm text-text-secondary">
          No generated articles saved yet. Generate one from SEO Agent first.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-border bg-surface/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl text-text-primary">{row.title}</h2>
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
      ) : null}
    </main>
  );
}
