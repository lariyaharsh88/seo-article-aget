import { NextResponse } from "next/server";
import {
  absoluteFeedUrl,
  absoluteSitemapUrl,
  runPostPublishDistributionHooks,
} from "@/lib/distribution/publish-hooks";

export const runtime = "nodejs";

/**
 * Post-publish hook: revalidate sitemap/feed routes + IndexNow ping.
 * Protect in production with CRON_SECRET or your own auth.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (process.env.NODE_ENV === "production" && secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { urls?: string[]; revalidatePaths?: string[] };
  try {
    body = (await request.json()) as { urls?: string[]; revalidatePaths?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const urls = Array.isArray(body.urls)
    ? body.urls.map((u) => u.trim()).filter(Boolean)
    : [];
  if (urls.length === 0) {
    return NextResponse.json({ error: "urls[] required" }, { status: 400 });
  }

  const result = await runPostPublishDistributionHooks({
    canonicalUrls: urls,
    revalidatePaths: body.revalidatePaths,
  });

  return NextResponse.json({
    ...result,
    hints: {
      sitemapUrl: absoluteSitemapUrl(),
      feedUrl: absoluteFeedUrl(),
      note: "Submit sitemap in Google Search Console; IndexNow covers Bing partners.",
    },
  });
}
