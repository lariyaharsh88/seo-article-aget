"use client";

import { useMemo } from "react";

export type WorkflowPhase = "keyword" | "article" | "publish";

type Props = {
  /** Step 1: brief / keyword captured */
  keywordComplete: boolean;
  /** Step 2: draft exists */
  articleComplete: boolean;
  /** Step 3: SEO pack / meta ready to ship */
  publishComplete: boolean;
  className?: string;
};

/**
 * Simplified 3-step mental model: Keyword → Article → Publish.
 * Maps to internal tabs/pipeline without exposing backend stage names.
 */
export function WorkflowStepper({
  keywordComplete,
  articleComplete,
  publishComplete,
  className = "",
}: Props) {
  const activePhase = useMemo((): WorkflowPhase => {
    if (!keywordComplete) return "keyword";
    if (!articleComplete) return "article";
    if (!publishComplete) return "publish";
    return "publish";
  }, [keywordComplete, articleComplete, publishComplete]);

  const steps: {
    id: WorkflowPhase;
    label: string;
    short: string;
    done: boolean;
    current: boolean;
  }[] = [
    {
      id: "keyword",
      label: "Keyword",
      short: "1",
      done: keywordComplete,
      current: activePhase === "keyword",
    },
    {
      id: "article",
      label: "Article",
      short: "2",
      done: articleComplete,
      current: activePhase === "article",
    },
    {
      id: "publish",
      label: "Publish",
      short: "3",
      done: publishComplete,
      current: activePhase === "publish" && !publishComplete,
    },
  ];

  return (
    <div
      className={`rounded-xl border border-border/80 bg-surface/60 p-3 sm:p-4 ${className}`}
      role="navigation"
      aria-label="Main workflow: keyword, article, publish"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          Your path
        </p>
        <span className="font-mono text-[10px] text-text-muted">
          Keyword → Article → Publish
        </span>
      </div>
      <ol className="mt-3 flex items-center gap-1 sm:gap-2">
        {steps.map((s, i) => (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <div
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-center transition-colors sm:px-2 ${
                s.done
                  ? "border-success/50 bg-success/10"
                  : s.current
                    ? "border-accent/60 bg-accent/10"
                    : "border-border/70 bg-background/40"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                  s.done
                    ? "bg-success/80 text-background"
                    : s.current
                      ? "bg-accent text-background"
                      : "bg-border/80 text-text-muted"
                }`}
                aria-hidden
              >
                {s.done ? "✓" : s.short}
              </span>
              <span
                className={`truncate font-mono text-[10px] sm:text-[11px] ${
                  s.current || s.done ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span
                className="mb-5 hidden h-px w-2 shrink-0 bg-border sm:block sm:w-3"
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-2 font-mono text-[10px] text-text-muted">
        {publishComplete
          ? "Ready to copy metadata and ship — use SEO package & share tools."
          : activePhase === "keyword"
            ? "Add a keyword or topic, then run generation."
            : activePhase === "article"
              ? "Generation will fill your draft — then refine in the Article tab."
              : "Open SEO package for titles, descriptions, and export."}
      </p>
    </div>
  );
}
