import { NextResponse } from "next/server";
import { runAutoRepurposeAfterSync } from "@/lib/education-news/auto-repurpose-after-sync";
import { fetchEducationMonitorArticles } from "@/lib/education-news/monitor";
import { syncEducationNewsArticles } from "@/lib/education-news/sync-stored";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // If unset, allow only Vercel Cron invocations.
    return request.headers.get("x-vercel-cron") === "1";
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("secret")?.trim();
  const header = request.headers.get("x-cron-secret")?.trim();
  return q === secret || header === secret || request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const monitor = await fetchEducationMonitorArticles();
    const sync = await syncEducationNewsArticles(monitor.articles, "education");
    await runAutoRepurposeAfterSync();

    return NextResponse.json({
      ok: true,
      scannedSources: monitor.scannedSources,
      matchedAnnouncements: monitor.matchedAnnouncements,
      syncedItems: monitor.articles.length,
      newPendingIds: sync.newPendingIds,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Monitor run failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
