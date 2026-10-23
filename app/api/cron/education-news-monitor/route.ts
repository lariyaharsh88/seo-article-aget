import { authorizeCronRequest } from "@/lib/cron-auth";
import { NextResponse } from "next/server";
import { runAutoRepurposeAfterSync } from "@/lib/education-news/auto-repurpose-after-sync";
import { fetchEducationMonitorArticles } from "@/lib/education-news/monitor";
import { syncEducationNewsArticles } from "@/lib/education-news/sync-stored";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
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
