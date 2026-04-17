"use client";

import { useMemo, useState } from "react";

type CreatedRow = {
  id: string;
  topic: string;
  title: string;
  url: string;
};

export default function NewsCreatePage() {
  const [topicsText, setTopicsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRows, setCreatedRows] = useState<CreatedRow[]>([]);

  const topicPreview = useMemo(() => {
    const seen = new Set<string>();
    return topicsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => {
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 50);
  }, [topicsText]);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    setCreatedRows([]);
    try {
      const res = await fetch("/api/education-news/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: topicsText }),
      });
      const data = (await res.json()) as {
        error?: string;
        created?: CreatedRow[];
      };
      if (!res.ok) {
        setError(data.error || "Failed to create topics.");
        return;
      }
      setCreatedRows(data.created || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <section className="rounded-2xl border border-border/80 bg-surface/45 p-5 md:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Education subdomain
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
          Create News From Topics
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-sm text-text-secondary md:text-base">
          Enter comma-separated topics. We will create education news article entries in bulk.
        </p>

        <label className="mt-5 block">
          <span className="font-mono text-xs text-text-muted">
            Topics (comma-separated)
          </span>
          <textarea
            value={topicsText}
            onChange={(e) => setTopicsText(e.target.value)}
            className="mt-2 min-h-[140px] w-full rounded-xl border border-border bg-background/60 p-3 font-serif text-sm text-text-primary outline-none transition-colors focus:border-accent/70"
            placeholder="UPSC exam update, CBSE date sheet 2026, NEET counselling round 1"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {topicPreview.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent"
            >
              {topic}
            </span>
          ))}
        </div>

        <p className="mt-3 font-mono text-[11px] text-text-muted">
          Topics to create: {topicPreview.length}
        </p>

        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={submitting || topicPreview.length === 0}
          className="btn-premium mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create articles"}
        </button>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-400/50 bg-rose-500/10 px-3 py-2 font-serif text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </section>

      {createdRows.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-border/80 bg-surface/45 p-5 md:p-8">
          <h2 className="font-display text-2xl text-text-primary">
            Created Articles ({createdRows.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {createdRows.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border/70 bg-background/40 p-3"
              >
                <p className="font-display text-lg text-text-primary">{row.title}</p>
                <p className="mt-1 font-mono text-[11px] text-text-muted">
                  Topic: {row.topic}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-text-muted">
                  Source URL: {row.url}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
