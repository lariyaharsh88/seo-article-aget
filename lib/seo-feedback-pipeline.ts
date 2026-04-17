import { fetchSearchConsolePageQueryMetrics } from "@/lib/gsc-queries";
import { buildFeedbackLoopAnalysis } from "@/lib/seo-feedback-loop";
import { buildFullArticleRefreshBundle } from "@/lib/seo-content-refresh";
import { prisma } from "@/lib/prisma";

export type FeedPipelineResult = {
  pageUrl: string;
  dateRange: { startDate: string; endDate: string; days: number };
  note?: string;
  rowCount: number;
  analysis: ReturnType<typeof buildFeedbackLoopAnalysis>;
  refreshBundle: ReturnType<typeof buildFullArticleRefreshBundle> | null;
};

/**
 * Fetch GSC metrics → underperforming queries → suggestions → optional LLM refresh prompts.
 */
export async function runSeoFeedbackPipeline(input: {
  pageUrl: string;
  primaryKeyword?: string;
  /** Optional article body to generate heading/section refresh prompts. */
  articleMarkdown?: string;
  prioritySectionHeading?: string;
}): Promise<FeedPipelineResult> {
  const { rows, note, dateRange } = await fetchSearchConsolePageQueryMetrics({
    pageUrl: input.pageUrl,
    days: 28,
    rowLimit: 250,
  });

  const analysis = buildFeedbackLoopAnalysis(
    input.pageUrl,
    rows,
    input.primaryKeyword,
  );

  let refreshBundle: FeedPipelineResult["refreshBundle"] = null;
  if (input.articleMarkdown?.trim()) {
    refreshBundle = buildFullArticleRefreshBundle({
      analysis,
      articleMarkdown: input.articleMarkdown,
      prioritySectionHeading: input.prioritySectionHeading,
    });
  }

  return {
    pageUrl: input.pageUrl,
    dateRange,
    note,
    rowCount: rows.length,
    analysis,
    refreshBundle,
  };
}

export async function persistSeoFeedbackSnapshot(
  pageUrl: string,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  try {
    const row = await prisma.seoFeedbackSnapshot.create({
      data: {
        pageUrl,
        payloadJson: payload as object,
      },
      select: { id: true },
    });
    return row;
  } catch (e) {
    console.error("[seo-feedback] persistSeoFeedbackSnapshot", e);
    throw new Error(
      "Could not save snapshot. Run prisma migrate deploy (SeoFeedbackSnapshot table).",
    );
  }
}
