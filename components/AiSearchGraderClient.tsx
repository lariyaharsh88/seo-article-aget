"use client";

import { useMemo, useState } from "react";

function grade(text: string, keyword: string) {
  const t = text.toLowerCase();
  const k = keyword.trim().toLowerCase();
  let score = 35;
  if (/^##\s+/m.test(text)) score += 15;
  if (/faq|frequently asked/i.test(text)) score += 10;
  if (/^\s*[-*]\s+/m.test(text)) score += 8;
  if (/\b\d+(\.\d+)?%?\b/.test(text)) score += 7;
  if (/\[([^\]]+)\]\((\/[^)]+)\)/.test(text)) score += 10;
  if (k) {
    const mentions = t.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))?.length ?? 0;
    if (mentions >= 3) score += 15;
  }
  return Math.min(100, score);
}

function buildSuggestions(text: string, keyword: string): string[] {
  const out: string[] = [];
  if (!/^##\s+/m.test(text)) out.push("Add clear H2 sections.");
  if (!/faq|frequently asked/i.test(text)) out.push("Add an FAQ section.");
  if (!/\[([^\]]+)\]\((\/[^)]+)\)/.test(text)) out.push("Add internal links to tool pages.");
  if (!/\b\d+(\.\d+)?%?\b/.test(text)) out.push("Add data points and concrete numbers.");
  if ((text.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"))?.length ?? 0) < 3) {
    out.push("Use the primary keyword naturally in intro, body, and conclusion.");
  }
  return out.slice(0, 5);
}

export function AiSearchGraderClient() {
  const [keyword, setKeyword] = useState("ai seo tools");
  const [content, setContent] = useState("");

  const score = useMemo(() => grade(content, keyword), [content, keyword]);
  const suggestions = useMemo(() => buildSuggestions(content, keyword), [content, keyword]);

  return (
    <section className="rounded-2xl border border-border bg-surface/70 p-5 md:p-6">
      <h2 className="font-display text-3xl text-text-primary">AI Search Grader</h2>
      <p className="mt-2 font-serif text-sm text-text-secondary">
        Check how ready your content is for AI answer engines and ChatGPT-style search.
      </p>
      <label className="mt-4 block">
        <span className="font-mono text-xs text-text-muted">Primary keyword</span>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
        />
      </label>
      <label className="mt-3 block">
        <span className="font-mono text-xs text-text-muted">Content</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste article content here..."
          className="mt-1 h-40 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-serif text-sm text-text-primary outline-none focus:border-accent"
        />
      </label>
      <div className="mt-4 rounded-xl border border-border bg-background/70 p-4">
        <p className="font-mono text-xs text-text-muted">AI Answer Score</p>
        <p className="mt-1 font-display text-3xl text-text-primary">{score}/100</p>
      </div>
      <div className="mt-3 rounded-xl border border-border bg-background/70 p-4">
        <p className="font-mono text-xs text-text-muted">Optimization suggestions</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-serif text-sm text-text-secondary">
          {suggestions.length > 0 ? suggestions.map((s) => <li key={s}>{s}</li>) : <li>Great structure. Keep it updated and specific.</li>}
        </ul>
      </div>
    </section>
  );
}

