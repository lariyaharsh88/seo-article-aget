import type { ContentUpdateSuggestion, FeedbackLoopAnalysis } from "@/lib/seo-feedback-loop";

/**
 * Prompt blocks for LLM-assisted refresh (pass to Gemini/OpenRouter with the article markdown).
 * Does not call APIs — your pipeline runs generation.
 */

export function buildHeadingImprovementPrompt(opts: {
  analysis: FeedbackLoopAnalysis;
  currentH1: string;
}): string {
  const kw = opts.analysis.underperforming.slice(0, 8).map((u) => u.query).join("; ");
  return `You are an SEO editor. Improve the article H1 and key H2 headings for better CTR and query match.

Current H1: ${opts.currentH1}

Underperforming / high-opportunity queries from Google Search Console:
${kw || "(none)"}

Rules:
- H1 ≤ 65 characters where possible; include the strongest 1–2 query phrases naturally.
- Propose a revised H1 and a list of H2 rewrites (same section order as the draft unless merging hurts clarity).
- No clickbait; align wording to documented search intent.
- Output markdown: ## Proposed H1 then ### H2 list with "Before → After" lines.`;
}

export function buildSectionRegeneratePrompt(opts: {
  sectionHeading: string;
  sectionMarkdown: string;
  suggestions: ContentUpdateSuggestion[];
  queryFocus: string[];
}): string {
  return `Rewrite ONLY this section for SEO depth and usefulness. Keep the same "## ${opts.sectionHeading}" heading unless a suggestion requires renaming (then show old → new once).

Current section markdown:
---
${opts.sectionMarkdown.slice(0, 12_000)}
---

Queries to satisfy better: ${opts.queryFocus.join("; ")}

Editorial instructions:
${opts.suggestions.map((s) => `- (${s.kind}) ${s.detail}`).join("\n")}

Requirements:
- Add concrete examples or a short comparison table if missing.
- Use the query phrases in natural language, not stuffed.
- Keep total section length similar or +15% max unless clearly thin.
- Output markdown for this section only (no front matter).`;
}

export function buildFullArticleRefreshBundle(opts: {
  analysis: FeedbackLoopAnalysis;
  articleMarkdown: string;
  /** e.g. first H2 to expand */
  prioritySectionHeading?: string;
}): {
  headingsPrompt: string;
  sectionPrompt?: string;
  checklist: string[];
} {
  const lines = opts.articleMarkdown.split(/\r?\n/);
  const h1Line = lines.find((l) => l.startsWith("# "));
  const currentH1 = h1Line?.replace(/^#\s+/, "").trim() ?? "";

  const headingsPrompt = buildHeadingImprovementPrompt({
    analysis: opts.analysis,
    currentH1,
  });

  let sectionPrompt: string | undefined;
  if (opts.prioritySectionHeading?.trim()) {
    const h = opts.prioritySectionHeading.trim();
    const idx = lines.findIndex((l) => l.startsWith(`## ${h}`) || l === `## ${h}`);
    if (idx >= 0) {
      let end = lines.length;
      for (let i = idx + 1; i < lines.length; i++) {
        if (lines[i].startsWith("## ")) {
          end = i;
          break;
        }
      }
      const sectionMd = lines.slice(idx, end).join("\n");
      const queries = opts.analysis.underperforming.slice(0, 5).map((u) => u.query);
      sectionPrompt = buildSectionRegeneratePrompt({
        sectionHeading: h,
        sectionMarkdown: sectionMd,
        suggestions: opts.analysis.suggestions.slice(0, 6),
        queryFocus: queries,
      });
    }
  }

  const checklist = [
    "Re-run /api/audit or internal SEO score after merge.",
    "Resubmit URL in IndexNow or wait for recrawl after publish.",
    "Compare GSC same 28-day window after 2–4 weeks (seasonality applies).",
  ];

  return { headingsPrompt, sectionPrompt, checklist };
}
