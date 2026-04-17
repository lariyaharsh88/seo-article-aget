import { NextResponse } from "next/server";
import { searchConsoleEnvConfigured } from "@/lib/gsc-queries";
import {
  persistSeoFeedbackSnapshot,
  runSeoFeedbackPipeline,
} from "@/lib/seo-feedback-pipeline";

export const runtime = "nodejs";

/**
 * Batch GSC feedback for multiple URLs (weekly or daily cron).
 * Env: SEO_FEEDBACK_PAGE_URLS=comma,separated,full,urls
 * Auth: Authorization: Bearer CRON_SECRET (required in production)
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (process.env.NODE_ENV === "production" && (!secret || auth !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!searchConsoleEnvConfigured()) {
    return NextResponse.json(
      { error: "GSC not configured" },
      { status: 503 },
    );
  }

  const envUrls = process.env.SEO_FEEDBACK_PAGE_URLS?.split(",")
    .map((u) => u.trim())
    .filter(Boolean) ?? [];

  let bodyUrls: string[] = [];
  try {
    const j = (await request.json()) as { urls?: string[] };
    if (Array.isArray(j.urls)) bodyUrls = j.urls.map((u) => String(u).trim()).filter(Boolean);
  } catch {
    /* ignore empty body */
  }

  const urls = bodyUrls.length > 0 ? bodyUrls : envUrls;
  if (urls.length === 0) {
    return NextResponse.json(
      {
        error:
          "No URLs: set SEO_FEEDBACK_PAGE_URLS or POST { urls: [\"https://...\"] }",
      },
      { status: 400 },
    );
  }

  const results: unknown[] = [];
  const errors: { url: string; message: string }[] = [];

  for (const pageUrl of urls) {
    try {
      const result = await runSeoFeedbackPipeline({ pageUrl });
      await persistSeoFeedbackSnapshot(pageUrl, {
        ...result,
        source: "cron",
        at: new Date().toISOString(),
      });
      results.push({ pageUrl, summary: result.analysis.summary });
    } catch (e) {
      errors.push({
        url: pageUrl,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    processed: results.length,
    results,
    errors,
  });
}
