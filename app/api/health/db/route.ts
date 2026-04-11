import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Quick DB connectivity check (for operators). Does not expose connection strings.
 */
export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - t0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    console.error("[health/db]", message);
    return NextResponse.json(
      { ok: false, latencyMs: Date.now() - t0 },
      { status: 503 },
    );
  }
}
