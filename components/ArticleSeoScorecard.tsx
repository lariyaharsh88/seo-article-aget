"use client";

import type { ArticleSeoScoreResult, SeoScoreAspect } from "@/lib/article-seo-score";

function barColor(status: SeoScoreAspect["status"]): string {
  switch (status) {
    case "good":
      return "bg-emerald-500/90";
    case "ok":
      return "bg-amber-500/85";
    default:
      return "bg-red-500/80";
  }
}

function ringColor(overall: number): string {
  if (overall >= 80) return "text-emerald-400";
  if (overall >= 50) return "text-amber-400";
  return "text-red-400/90";
}

export function ArticleSeoScorecard({
  result,
  compact,
}: {
  result: ArticleSeoScoreResult;
  /** Tighter layout for under the editor */
  compact?: boolean;
}) {
  const { overall, aspects, wordCount, focusKeyword } = result;

  return (
    <section
      className={`rounded-xl border border-border bg-surface/90 ${
        compact ? "p-4" : "p-5"
      }`}
      aria-label="On-page SEO score"
    >
      <div
        className={`flex flex-col gap-4 ${compact ? "sm:flex-row sm:items-start sm:justify-between" : "md:flex-row md:items-start md:justify-between"}`}
      >
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            Content SEO score
          </p>
          {!compact && (
            <p className="font-serif text-sm text-text-secondary">
              Heuristic checks similar to plugins like Yoast or Rank Math — on-page
              signals only, not live SERP data.
            </p>
          )}
          {compact && (
            <p className="font-serif text-xs text-text-muted">
              Yoast / Rank Math–style on-page checks (not live SERP data).
            </p>
          )}
          <p className="font-mono text-xs text-text-muted">
            Focus: <span className="text-text-secondary">{focusKeyword}</span>
            {" · "}
            {wordCount.toLocaleString()} words
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center justify-center ${compact ? "" : "md:pr-2"}`}
          aria-hidden
        >
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-border"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={ringColor(overall)}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${overall}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-text-primary">
              {overall}
            </span>
          </div>
        </div>
      </div>

      <ul className={`mt-5 space-y-4 ${compact ? "mt-4" : ""}`}>
        {aspects.map((aspect) => (
          <li key={aspect.id}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-text-primary">
                {aspect.label}
              </span>
              <span
                className={`font-mono text-xs ${
                  aspect.status === "good"
                    ? "text-emerald-400"
                    : aspect.status === "ok"
                      ? "text-amber-400"
                      : "text-red-400/90"
                }`}
              >
                {aspect.score}/100
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background/80">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${barColor(aspect.status)}`}
                style={{ width: `${aspect.score}%` }}
              />
            </div>
            {!compact && aspect.tips.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 font-serif text-xs text-text-muted">
                {aspect.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
