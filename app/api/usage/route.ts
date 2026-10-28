import { NextResponse } from "next/server";
import {
  MONTHLY_RUN_LIMITS,
  getMonthlyRunUsage,
  resolveUsageSubject,
} from "@/lib/usage-guard";

export const dynamic = "force-dynamic";

/** Current month's article-run usage for the caller (signed-in user or guest IP). */
export async function GET(request: Request) {
  try {
    const { subject, userId, plan } = await resolveUsageSubject(request);
    const used = await getMonthlyRunUsage(subject);
    const limit = MONTHLY_RUN_LIMITS[plan];
    return NextResponse.json({
      signedIn: Boolean(userId),
      plan,
      used: Math.min(used, limit),
      limit,
      remaining: Math.max(0, limit - used),
    });
  } catch (e) {
    console.error("[api/usage]", e);
    return NextResponse.json({ error: "Usage service unavailable" }, { status: 503 });
  }
}
