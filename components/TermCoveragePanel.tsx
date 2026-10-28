"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { scoreCoverage, type CoverageTerm, type TermStatus } from "@/lib/term-coverage";

export interface TermCoveragePanelProps {
  markdown: string;
  keyword: string;
  disabled?: boolean;
}

interface ApiData {
  keyword: string;
  competitors: { url: string; title: string; wordCount: number }[];
  terms: CoverageTerm[];
  avgWordCount: number;
  medianWordCount: number;
  headingsSample: string[];
}

type Filter = "all" | Exclude<TermStatus, "ok">;

const chipClass: Record<TermStatus, string> = {
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  under: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  over: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  missing: "border-red-500/40 bg-red-500/10 text-red-400/90",
};

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-400";
  if (n >= 50) return "text-amber-400";
  return "text-red-400/90";
}

export default function TermCoveragePanel({ markdown, keyword, disabled }: TermCoveragePanelProps) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [debounced, setDebounced] = useState(markdown);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(markdown), 400);
    return () => clearTimeout(t);
  }, [markdown]);

  const result = useMemo(
    () => (data ? scoreCoverage(debounced, data.terms, data.medianWordCount) : null),
    [data, debounced],
  );

  async function analyze() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const { data: s } = await getSupabaseBrowserClient().auth.getSession();
        if (s.session?.access_token) headers.Authorization = `Bearer ${s.session.access_token}`;
      } catch {
        /* no session */
      }
      const res = await fetch("/api/term-coverage", {
        method: "POST",
        headers,
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setData(json as ApiData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const items = result?.items.filter((i) => filter === "all" || i.status === filter) ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Term coverage</h3>
        <button
          type="button"
          onClick={analyze}
          disabled={disabled || loading || !keyword.trim()}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : data ? "Re-analyze" : "Analyze top-ranking pages"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400/90">{error}</p>}
      {!data && !error && (
        <p className="text-xs text-text-muted">
          Compare your draft against terms used by the current top Google results for “{keyword || "your keyword"}”.
        </p>
      )}
      {data && result && (
        <>
          <div className="flex items-end gap-6">
            <div>
              <div className={`font-mono text-4xl font-bold ${scoreColor(result.score)}`}>{result.score}</div>
              <div className="text-xs text-text-muted">coverage / 100</div>
            </div>
            <div className="text-xs text-text-muted">
              <div>
                Words:{" "}
                <span
                  className={`font-mono ${
                    result.wordCountStatus === "ok"
                      ? "text-emerald-400"
                      : result.wordCountStatus === "unknown"
                        ? "text-text-primary"
                        : "text-amber-400"
                  }`}
                >
                  {result.wordCount}
                </span>{" "}
                vs median <span className="font-mono text-text-primary">{data.medianWordCount}</span>
              </div>
              <div className="font-mono">
                {result.counts.ok} ok · {result.counts.under} under · {result.counts.over} over ·{" "}
                {result.counts.missing} missing
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {(["all", "missing", "under", "over"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-2 py-1 text-xs ${
                  filter === f ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {f === "all" ? "All" : f === "over" ? "Overused" : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
            {items.map((t) => (
              <span
                key={t.term}
                title={`Used by ${t.pages}/${data.competitors.length} pages (avg ${t.avgCount})`}
                className={`rounded-md border px-2 py-0.5 text-xs ${chipClass[t.status]}`}
              >
                {t.term}{" "}
                <span className="font-mono opacity-80">
                  {t.count}/{t.recommended[0]}–{t.recommended[1]}
                </span>
              </span>
            ))}
            {!items.length && <span className="text-xs text-text-muted">No terms in this filter.</span>}
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-text-primary">Competitors analyzed</div>
            <ul className="space-y-1">
              {data.competitors.map((c) => (
                <li key={c.url} className="flex justify-between gap-2 text-xs">
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="truncate text-accent hover:underline">
                    {c.title || c.url}
                  </a>
                  <span className="shrink-0 font-mono text-text-muted">{c.wordCount}w</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
