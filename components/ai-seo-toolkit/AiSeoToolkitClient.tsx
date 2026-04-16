"use client";

import { useCallback, useState } from "react";

type Tab = "visibility" | "prompts" | "optimize";

type VisibilityRow = {
  keyword: string;
  mentioned: boolean;
  position: number | null;
};

export function AiSeoToolkitClient() {
  const [tab, setTab] = useState<Tab>("visibility");

  // Visibility
  const [domain, setDomain] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [visLoading, setVisLoading] = useState(false);
  const [visError, setVisError] = useState<string | null>(null);
  const [visRows, setVisRows] = useState<VisibilityRow[] | null>(null);

  // Prompts
  const [seed, setSeed] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [queries, setQueries] = useState<string[] | null>(null);
  const [copyPromptOk, setCopyPromptOk] = useState(false);

  // Optimize
  const [optKeyword, setOptKeyword] = useState("");
  const [optContent, setOptContent] = useState("");
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<{
    text: string;
    score: number;
  } | null>(null);
  const [copyOptOk, setCopyOptOk] = useState(false);

  const runVisibility = useCallback(async () => {
    setVisError(null);
    setVisRows(null);
    const kw = keywordsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setVisLoading(true);
    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), keywords: kw }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setVisRows(data as VisibilityRow[]);
    } catch (e) {
      setVisError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setVisLoading(false);
    }
  }, [domain, keywordsText]);

  const runPrompts = useCallback(async () => {
    setPromptError(null);
    setQueries(null);
    setCopyPromptOk(false);
    setPromptLoading(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: seed.trim() }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const q =
        typeof data === "object" &&
        data !== null &&
        "queries" in data &&
        Array.isArray((data as { queries: unknown }).queries)
          ? (data as { queries: string[] }).queries
          : [];
      setQueries(q);
    } catch (e) {
      setPromptError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPromptLoading(false);
    }
  }, [seed]);

  const runOptimize = useCallback(async () => {
    setOptError(null);
    setOptimized(null);
    setCopyOptOk(false);
    setOptLoading(true);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: optKeyword.trim(),
          content: optContent,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const o = data as { optimizedContent?: string; score?: number };
      if (typeof o.optimizedContent !== "string") {
        throw new Error("Invalid response");
      }
      setOptimized({
        text: o.optimizedContent,
        score: typeof o.score === "number" ? o.score : 0,
      });
    } catch (e) {
      setOptError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setOptLoading(false);
    }
  }, [optKeyword, optContent]);

  const copyPrompts = useCallback(() => {
    if (!queries?.length) return;
    void navigator.clipboard.writeText(queries.join("\n")).then(() => {
      setCopyPromptOk(true);
      window.setTimeout(() => setCopyPromptOk(false), 2000);
    });
  }, [queries]);

  const copyOptimized = useCallback(() => {
    if (!optimized?.text) return;
    void navigator.clipboard.writeText(optimized.text).then(() => {
      setCopyOptOk(true);
      window.setTimeout(() => setCopyOptOk(false), 2000);
    });
  }, [optimized]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "visibility", label: "AI Visibility" },
    { id: "prompts", label: "Prompt mining" },
    { id: "optimize", label: "AEO optimizer" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          MVP · Lightweight stack
        </p>
        <h1 className="font-display text-3xl text-text-primary md:text-4xl">
          AI SEO Toolkit
        </h1>
        <p className="max-w-2xl font-serif text-text-secondary">
          Track brand mentions in synthetic AI answers, mine autocomplete +
          generated prompts, and rewrite drafts for answer engines — all in one
          workspace.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2 border-b border-border pb-2"
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 font-mono text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              tab === t.id
                ? "bg-accent text-background"
                : "border border-border text-text-secondary hover:border-accent/60 hover:text-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "visibility" && (
        <section className="space-y-6" aria-labelledby="vis-heading">
          <h2 id="vis-heading" className="font-display text-xl text-text-primary">
            Visibility tracker
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            Sends each keyword to an LLM with a list-style prompt, then checks
            whether your domain appears and estimates rank in numbered sections.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="font-mono text-xs uppercase text-text-muted">
                Domain
              </span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Keywords (one per line or comma-separated)
            </span>
            <textarea
              className="custom-scrollbar min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="best mba colleges&#10;top engineering colleges"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => void runVisibility()}
            disabled={visLoading || !domain.trim()}
            className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {visLoading ? "Checking…" : "Run visibility check"}
          </button>
          {visError && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-200">
              {visError}
            </p>
          )}
          {visRows && visRows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-4 py-3">Keyword</th>
                    <th className="px-4 py-3">Mentioned</th>
                    <th className="px-4 py-3">Position (est.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-serif">
                  {visRows.map((row) => (
                    <tr key={row.keyword}>
                      <td className="px-4 py-3 text-text-primary">
                        {row.keyword}
                      </td>
                      <td className="px-4 py-3">
                        {row.mentioned ? (
                          <span className="text-emerald-400">Yes</span>
                        ) : (
                          <span className="text-text-muted">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {row.position ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "prompts" && (
        <section className="space-y-6" aria-labelledby="pm-heading">
          <h2 id="pm-heading" className="font-display text-xl text-text-primary">
            Prompt mining
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            Pulls Google autocomplete for your seed, adds 20 AI-generated
            questions, dedupes, and stores rows in SQLite.
          </p>
          <label className="block max-w-xl space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Seed keyword
            </span>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="mba colleges"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => void runPrompts()}
            disabled={promptLoading || seed.trim().length < 2}
            className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {promptLoading ? "Mining…" : "Mine prompts"}
          </button>
          {promptError && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-200">
              {promptError}
            </p>
          )}
          {queries && queries.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {queries.length} queries
                </span>
                <button
                  type="button"
                  onClick={copyPrompts}
                  className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {copyPromptOk ? "Copied" : "Copy all"}
                </button>
              </div>
              <ul className="custom-scrollbar max-h-[50vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-surface/60 p-4">
                {queries.map((q) => (
                  <li
                    key={q}
                    className="border-b border-border/50 pb-2 font-serif text-sm text-text-primary last:border-0 last:pb-0"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {tab === "optimize" && (
        <section className="space-y-6" aria-labelledby="aeo-heading">
          <h2 id="aeo-heading" className="font-display text-xl text-text-primary">
            AEO content optimizer
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            Rewrites your draft for AI search surfaces with headings, bullets,
            and five FAQs. Score is a local heuristic (length + structure).
          </p>
          <label className="block max-w-xl space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Target keyword / topic
            </span>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="mba colleges in india"
              value={optKeyword}
              onChange={(e) => setOptKeyword(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Original content
            </span>
            <textarea
              className="custom-scrollbar min-h-[200px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Paste raw paragraphs or bullet notes…"
              value={optContent}
              onChange={(e) => setOptContent(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => void runOptimize()}
            disabled={
              optLoading || optKeyword.trim().length < 2 || optContent.length < 40
            }
            className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {optLoading ? "Optimizing…" : "Optimize for AEO"}
          </button>
          {optError && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-200">
              {optError}
            </p>
          )}
          {optimized && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-sm text-text-muted">
                  Score:{" "}
                  <strong className="text-accent">{optimized.score}</strong>
                  /100
                </span>
                <button
                  type="button"
                  onClick={copyOptimized}
                  className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {copyOptOk ? "Copied" : "Copy Markdown"}
                </button>
              </div>
              <pre className="custom-scrollbar max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface/80 p-4 font-mono text-xs leading-relaxed text-text-primary md:text-sm">
                {optimized.text}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
