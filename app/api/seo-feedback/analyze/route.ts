import { NextResponse } from "next/server";
import { searchConsoleEnvConfigured } from "@/lib/gsc-queries";
import {
  persistSeoFeedbackSnapshot,
  runSeoFeedbackPipeline,
} from "@/lib/seo-feedback-pipeline";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * POST /api/seo-feedback/analyze
 * Body: { pageUrl?, primaryKeyword?, articleMarkdown?, prioritySectionHeading?, saveSnapshot? }
 * If pageUrl omitted, uses GSC_SITE_URL (site root) — only useful for site-wide smoke tests.
 *
 * Auth (production): Supabase session Bearer **or** CRON_SECRET **or** SEO_FEEDBACK_ALLOW_OPEN=1
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const user = await getSupabaseUserFromRequest(request);
  const allowOpen = process.env.SEO_FEEDBACK_ALLOW_OPEN === "1";
  const isCron = Boolean(secret && auth && auth === secret);
  const okAuth =
    user ||
    isCron ||
    allowOpen ||
    process.env.NODE_ENV !== "production";
  if (!okAuth) {
    return NextResponse.json(
      { error: "Unauthorized — sign in, use CRON_SECRET, or set SEO_FEEDBACK_ALLOW_OPEN=1" },
      { status: 401 },
    );
  }

  if (!searchConsoleEnvConfigured()) {
    return NextResponse.json(
      {
        error:
          "Search Console not configured. Set GSC_SITE_URL and GSC_SERVICE_ACCOUNT_JSON (or OAuth vars).",
      },
      { status: 503 },
    );
  }

  let body: {
    pageUrl?: string;
    primaryKeyword?: string;
    articleMarkdown?: string;
    prioritySectionHeading?: string;
    saveSnapshot?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pageUrl =
    body.pageUrl?.trim() ||
    process.env.GSC_SITE_URL?.trim() ||
    "";
  if (!pageUrl) {
    return NextResponse.json(
      { error: "pageUrl is required (or set GSC_SITE_URL)" },
      { status: 400 },
    );
  }

  try {
    const result = await runSeoFeedbackPipeline({
      pageUrl,
      primaryKeyword: body.primaryKeyword,
      articleMarkdown: body.articleMarkdown,
      prioritySectionHeading: body.prioritySectionHeading,
    });

    let snapshotId: string | undefined;
    if (body.saveSnapshot) {
      const saved = await persistSeoFeedbackSnapshot(pageUrl, {
        ...result,
        savedAt: new Date().toISOString(),
      });
      snapshotId = saved.id;
    }

    return NextResponse.json({ ...result, snapshotId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Feedback pipeline failed";
    console.error("[seo-feedback/analyze]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
