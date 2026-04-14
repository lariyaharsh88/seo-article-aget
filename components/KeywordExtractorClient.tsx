"use client";

import { useMemo, useState } from "react";

const STOPWORDS = new Set([
  "the","a","an","and","or","to","of","in","for","on","with","is","are","be","as","that","this","it","by","from","at","your","you","we","our","can","will","into","how","what","why","when","where","who","which","about","more","less","than",
]);

function extractKeywords(text: string): Array<{ term: string; count: number }> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/g)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  const map = new Map<string, number>();
  words.forEach((w) => map.set(w, (map.get(w) ?? 0) + 1));
  return Array.from(map.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
}

export function KeywordExtractorClient() {
  const [input, setInput] = useState("");
  const keywords = useMemo(() => extractKeywords(input), [input]);

  return (
    <section className="rounded-2xl border border-border bg-surface/70 p-5 md:p-6">
      <h2 className="font-display text-3xl text-text-primary">Keyword Extractor</h2>
      <p className="mt-2 font-serif text-sm text-text-secondary">
        Paste text and extract high-signal keywords to seed your SEO workflow.
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste article, notes, or transcript..."
        className="mt-4 h-40 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-serif text-sm text-text-primary outline-none focus:border-accent"
      />
      <div className="mt-4 rounded-xl border border-border bg-background/70 p-4">
        <p className="font-mono text-xs text-text-muted">Extracted keywords</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {keywords.map((k) => (
            <li key={k.term} className="rounded-md border border-border px-3 py-2 font-mono text-xs text-text-secondary">
              {k.term} <span className="text-text-muted">({k.count})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

