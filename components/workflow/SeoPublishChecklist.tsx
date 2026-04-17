"use client";

import { useMemo } from "react";
import type { SeoMeta } from "@/lib/types";
import { markdownToPlainText } from "@/lib/article-seo-score";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
};

type Props = {
  articleMarkdown: string;
  meta: SeoMeta | null;
  hasKeywordBrief: boolean;
  contentScore?: number;
  className?: string;
};

function extractH1(md: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

/**
 * Ship-ready checklist derived from draft + audit metadata (no extra API calls).
 */
export function buildPublishChecklistItems(input: {
  articleMarkdown: string;
  meta: SeoMeta | null;
  hasKeywordBrief: boolean;
}): ChecklistItem[] {
  const plain = markdownToPlainText(input.articleMarkdown);
  const words = plain.split(/\s+/).filter(Boolean).length;
  const h1 = extractH1(input.articleMarkdown);
  const h2count = (input.articleMarkdown.match(/^##\s+/gm) ?? []).length;
  const internalLinks = (input.articleMarkdown.match(/\]\(\//g) ?? []).length;

  return [
    {
      id: "brief",
      label: "Keyword / topic in brief",
      done: input.hasKeywordBrief,
      hint: "Use Simple or Advanced brief before running.",
    },
    {
      id: "draft",
      label: `Strong draft (${words} words)`,
      done: words >= 400,
      hint: "Aim for 800+ for competitive queries.",
    },
    {
      id: "h1",
      label: "Clear H1",
      done: h1.length > 0,
    },
    {
      id: "structure",
      label: "Section structure (H2s)",
      done: h2count >= 3,
      hint: "Add H2 sections for each major intent.",
    },
    {
      id: "meta",
      label: "Meta title & description (audit)",
      done: Boolean(
        input.meta?.metaTitle?.trim() && input.meta?.metaDescription?.trim(),
      ),
      hint: "Run the full pipeline to populate SEO package.",
    },
    {
      id: "links",
      label: "Internal links",
      done: internalLinks >= 2,
      hint: "Link to related hubs on your site.",
    },
  ];
}

export function SeoPublishChecklist({
  articleMarkdown,
  meta,
  hasKeywordBrief,
  contentScore,
  className = "",
}: Props) {
  const items = useMemo(
    () =>
      buildPublishChecklistItems({
        articleMarkdown,
        meta,
        hasKeywordBrief,
      }),
    [articleMarkdown, meta, hasKeywordBrief],
  );

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;

  return (
    <section
      className={`rounded-xl border border-border/80 bg-background/40 p-3 ${className}`}
      aria-label="Publish checklist"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          SEO checklist
        </p>
        <span className="font-mono text-[10px] text-text-muted">
          {doneCount}/{total}
        </span>
      </div>
      {typeof contentScore === "number" ? (
        <p className="mt-1 font-mono text-[10px] text-text-muted">
          Content score snapshot:{" "}
          <span className="text-accent">{contentScore}</span>/100
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-2 rounded-lg border border-border/60 bg-surface/50 px-2 py-1.5"
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border font-mono text-[10px] ${
                item.done
                  ? "border-success/60 bg-success/20 text-success"
                  : "border-border text-text-muted"
              }`}
              aria-hidden
            >
              {item.done ? "✓" : ""}
            </span>
            <div className="min-w-0">
              <p
                className={`font-mono text-[11px] leading-snug ${
                  item.done ? "text-text-secondary" : "text-text-primary"
                }`}
              >
                {item.label}
              </p>
              {!item.done && item.hint ? (
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  {item.hint}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
