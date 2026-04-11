"use client";

import type { GscQueryRow } from "@/lib/gsc-queries";
import type { FeaturedSnippet, Keyword } from "@/lib/types";

const TYPE_ORDER: Keyword["type"][] = [
  "primary",
  "secondary",
  "lsi",
  "longtail",
];

const TYPE_LABEL: Record<Keyword["type"], string> = {
  primary: "Primary",
  secondary: "Secondary",
  lsi: "LSI",
  longtail: "Long-tail",
};

const TYPE_RING: Record<Keyword["type"], string> = {
  primary: "ring-amber-400/50",
  secondary: "ring-cyan-400/40",
  lsi: "ring-purple/50",
  longtail: "ring-pink-400/40",
};

function difficultyClass(d: Keyword["difficulty"]): string {
  if (d === "low") return "bg-success/20 text-success";
  if (d === "medium") return "bg-accent/20 text-accent";
  return "bg-red-400/20 text-red-300";
}

interface KeywordsPanelProps {
  keywords: Keyword[];
  paas: string[];
  featuredSnippet: FeaturedSnippet | null;
  gscRows: GscQueryRow[];
  googleSuggestions: string[];
}

export function KeywordsPanel({
  keywords,
  paas,
  featuredSnippet,
  gscRows,
  googleSuggestions,
}: KeywordsPanelProps) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: keywords.filter((k) => k.type === type),
  }));

  return (
    <div className="space-y-6">
      {gscRows.length > 0 ? (
        <section aria-labelledby="gsc-queries-heading">
          <h3
            id="gsc-queries-heading"
            className="mb-2 font-mono text-xs uppercase tracking-wide text-success"
          >
            Search Console · top queries (used in keyword pass)
          </h3>
          <ul className="space-y-1.5 rounded-lg border border-success/25 bg-success/5 p-3 font-mono text-xs text-text-secondary">
            {gscRows.slice(0, 20).map((row) => (
              <li key={row.query} className="flex flex-wrap justify-between gap-2">
                <span className="min-w-0 flex-1">{row.query}</span>
                <span className="shrink-0 text-[10px] text-text-muted">
                  {row.clicks} clicks · {Math.round(row.impressions)} impr.
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {googleSuggestions.length > 0 ? (
        <section aria-labelledby="autosuggest-heading">
          <h3
            id="autosuggest-heading"
            className="mb-2 font-mono text-xs uppercase tracking-wide text-accent"
          >
            Google autocomplete (used in keyword pass)
          </h3>
          <ul className="flex flex-wrap gap-2">
            {googleSuggestions.map((s) => (
              <li
                key={s}
                className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-serif text-xs text-text-primary"
              >
                {s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {grouped.map(({ type, items }) => (
        <section key={type} aria-labelledby={`kw-${type}`}>
          <h3
            id={`kw-${type}`}
            className={`mb-2 inline-flex rounded-md px-2 py-1 font-mono text-xs uppercase tracking-wide ring-1 ${TYPE_RING[type]} bg-surface text-text-primary`}
          >
            {TYPE_LABEL[type]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {items.length === 0 && (
              <span className="text-sm text-text-muted">No keywords yet.</span>
            )}
            {items.map((k) => (
              <span
                key={`${k.keyword}-${k.type}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 font-serif text-sm text-text-primary"
              >
                {k.keyword}
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${difficultyClass(k.difficulty)}`}
                >
                  {k.difficulty}
                </span>
              </span>
            ))}
          </div>
        </section>
      ))}

      {paas.length > 0 && (
        <section aria-labelledby="paa-heading">
          <h3
            id="paa-heading"
            className="mb-2 font-mono text-xs uppercase text-pink-400"
          >
            People also ask
          </h3>
          <ul className="space-y-2">
            {paas.map((q, i) => (
              <li
                key={i}
                className="flex gap-2 font-serif text-sm text-text-secondary"
              >
                <span className="text-pink-400" aria-hidden>
                  ?
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featuredSnippet ? (
        <section
          aria-labelledby="featured-snippet-heading"
          className="rounded-xl border border-info/35 bg-info/5 p-4"
        >
          <h3
            id="featured-snippet-heading"
            className="mb-2 font-mono text-xs uppercase tracking-wide text-info"
          >
            Featured snippet · answer box
          </h3>
          {featuredSnippet.title ? (
            <p className="font-serif text-sm font-medium text-text-primary">
              {featuredSnippet.title}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap font-serif text-sm leading-relaxed text-text-secondary">
            {featuredSnippet.text}
          </p>
          {featuredSnippet.url ? (
            <a
              href={featuredSnippet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-xs text-info underline-offset-2 hover:underline"
            >
              Source ↗
            </a>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
