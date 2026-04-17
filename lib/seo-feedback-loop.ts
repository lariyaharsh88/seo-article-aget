import type { GscQueryMetricRow } from "@/lib/gsc-queries";

export type UnderperformReason =
  | "low_ctr_high_impressions"
  | "stuck_page_two_plus"
  | "zero_clicks_high_impressions"
  | "below_median_ctr";

export type UnderperformingKeyword = GscQueryMetricRow & {
  reasons: UnderperformReason[];
  priorityScore: number;
};

export type ContentUpdateSuggestion = {
  keyword: string;
  kind:
    | "expand_section"
    | "add_faq"
    | "improve_title_meta"
    | "strengthen_intro"
    | "add_internal_links";
  detail: string;
};

export type FeedbackLoopAnalysis = {
  pageUrl: string;
  medianCtr: number;
  underperforming: UnderperformingKeyword[];
  suggestions: ContentUpdateSuggestion[];
  summary: string;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const DEFAULT_MIN_IMPRESSIONS = 50;
const DEFAULT_CTR_FLOOR = 0.02;
const DEFAULT_POSITION_STUCK = 10;

/**
 * Identify queries where the page earns visibility but under-converts clicks or ranks past page 1.
 */
export function analyzeUnderperformingKeywords(
  rows: GscQueryMetricRow[],
  opts?: {
    minImpressions?: number;
    ctrFloor?: number;
    stuckPosition?: number;
    minImpressionsNoClick?: number;
  },
): UnderperformingKeyword[] {
  const minImp = opts?.minImpressions ?? DEFAULT_MIN_IMPRESSIONS;
  const ctrFloor = opts?.ctrFloor ?? DEFAULT_CTR_FLOOR;
  const stuck = opts?.stuckPosition ?? DEFAULT_POSITION_STUCK;
  const minNoClick = opts?.minImpressionsNoClick ?? 150;

  const ctrs = rows.filter((r) => r.impressions > 0).map((r) => r.ctr);
  const med = median(ctrs);

  const out: UnderperformingKeyword[] = [];

  for (const r of rows) {
    const reasons: UnderperformReason[] = [];
    if (r.impressions >= minImp && r.ctr < ctrFloor && r.impressions >= 80) {
      reasons.push("low_ctr_high_impressions");
    }
    if (r.impressions >= minImp && r.position >= stuck) {
      reasons.push("stuck_page_two_plus");
    }
    if (r.clicks === 0 && r.impressions >= minNoClick) {
      reasons.push("zero_clicks_high_impressions");
    }
    if (r.impressions >= minImp && med > 0 && r.ctr < med * 0.5 && r.impressions >= 100) {
      reasons.push("below_median_ctr");
    }

    if (reasons.length === 0) continue;

    const priorityScore =
      r.impressions * (1 + reasons.length) +
      (r.position >= stuck ? 50 : 0) +
      (r.clicks === 0 ? 30 : 0);

    out.push({ ...r, reasons, priorityScore });
  }

  return out.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildContentUpdateSuggestions(
  underperforming: UnderperformingKeyword[],
  primaryKeywordHint?: string,
): ContentUpdateSuggestion[] {
  const suggestions: ContentUpdateSuggestion[] = [];

  for (const u of underperforming.slice(0, 15)) {
    const q = u.query;
    const parts: string[] = [];
    if (u.reasons.includes("zero_clicks_high_impressions") || u.reasons.includes("low_ctr_high_impressions")) {
      parts.push(
        "CTR/snippet: align title + first paragraph with query intent; add a direct answer in 2–3 sentences.",
      );
    }
    if (u.reasons.includes("stuck_page_two_plus")) {
      parts.push(
        `Ranking ~position ${u.position.toFixed(1)}: deepen with examples, a table, and 2 internal links.`,
      );
    }
    if (u.reasons.includes("below_median_ctr")) {
      parts.push("CTR below page median: strengthen hook + proof in the relevant section.");
    }
    parts.push(`FAQ: add Q&A that naturally includes “${q.slice(0, 100)}”.`);

    suggestions.push({
      keyword: q,
      kind: "expand_section",
      detail: parts.join(" "),
    });
  }

  if (primaryKeywordHint?.trim()) {
    const pk = primaryKeywordHint.trim().toLowerCase();
    const weak = underperforming.some((u) => u.query.toLowerCase().includes(pk));
    if (weak) {
      suggestions.push({
        keyword: pk,
        kind: "add_internal_links",
        detail:
          "Primary topic shows in weak queries: add 2–3 internal links to cluster pages and one outbound authority cite.",
      });
    }
  }

  return suggestions.slice(0, 18);
}

export function buildFeedbackLoopAnalysis(
  pageUrl: string,
  rows: GscQueryMetricRow[],
  primaryKeywordHint?: string,
): FeedbackLoopAnalysis {
  const ctrs = rows.filter((r) => r.impressions > 0).map((r) => r.ctr);
  const medianCtr = median(ctrs);
  const underperforming = analyzeUnderperformingKeywords(rows);
  const suggestions = buildContentUpdateSuggestions(underperforming, primaryKeywordHint);

  const summary = [
    `${rows.length} queries in window.`,
    `Approx. median CTR ${(medianCtr * 100).toFixed(2)}%.`,
    `${underperforming.length} underperforming queries flagged.`,
    suggestions.length > 0 ? `${suggestions.length} content actions suggested.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    pageUrl,
    medianCtr,
    underperforming,
    suggestions,
    summary,
  };
}
