import { NextResponse } from "next/server";
import { authorizeCronRequest, runPingSitemapsCron } from "@/lib/ping-sitemaps-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pinged } = await runPingSitemapsCron();
    return NextResponse.json({ ok: true, slot: "evening", pinged, at: new Date().toISOString() });
  } catch (e) {
    console.error("[cron/ping-sitemaps-evening]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ping failed" },
      { status: 500 },
    );
  }
}
