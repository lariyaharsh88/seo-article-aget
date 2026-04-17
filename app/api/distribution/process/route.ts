import { NextResponse } from "next/server";
import { processDueDistributionBatches } from "@/lib/distribution/process-queue";

export const runtime = "nodejs";

/**
 * Cron / worker endpoint. Protect with CRON_SECRET (or Vercel Cron header).
 * Example: curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/distribution/process
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Set CRON_SECRET to call this endpoint in production" },
      { status: 503 },
    );
  }

  try {
    const result = await processDueDistributionBatches({ limit: 10 });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "process failed";
    console.error("[distribution/process]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
