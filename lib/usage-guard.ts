import { createHash, timingSafeEqual } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

/**
 * Server-side protection for routes that spend our provider keys (Gemini, Tavily, Serper, …).
 *
 * - `run`  — one full article generation (POST /api/article). Counts against the monthly plan quota.
 * - `step` — a pipeline step or paid tool call (research, SERP, audit, …). Rate limited per hour.
 * - `chat` — the public site chat widget. Rate limited per hour.
 *
 * Bypass: blog admin (NextAuth session) and server-to-server calls carrying `x-internal-token`.
 * Requests that bring their own Gemini key (`x-gemini-key`) skip the quota but are still rate limited.
 */
export type UsageKind = "run" | "step" | "chat";

export type PlanId = "guest" | "free" | "pro" | "scale" | "enterprise";

/** Monthly article runs per plan. Paid plans are "unlimited" on the pricing page — these are fair-use caps. */
export const MONTHLY_RUN_LIMITS: Record<PlanId, number> = {
  guest: 2,
  free: 5,
  pro: 300,
  scale: 1000,
  enterprise: 5000,
};

const HOURLY_LIMITS: Record<UsageKind, { anon: number; user: number }> = {
  run: { anon: 4, user: 30 },
  step: { anon: 40, user: 300 },
  chat: { anon: 30, user: 60 },
};

export type UsageContext = {
  subject: string;
  userId: string | null;
  plan: PlanId;
  unlimited: boolean;
};

type GuardResult =
  | { ok: true; ctx: UsageContext }
  | { ok: false; response: NextResponse };

export const INTERNAL_TOKEN_HEADER = "x-internal-token";

export function getInternalApiSecret(): string | undefined {
  return (
    process.env.INTERNAL_API_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    undefined
  );
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isInternalRequest(request: Request): boolean {
  const secret = getInternalApiSecret();
  const token = request.headers.get(INTERNAL_TOKEN_HEADER)?.trim();
  return Boolean(secret && token && safeEqual(token, secret));
}

async function isBlogAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    return Boolean(session?.user);
  } catch {
    return false;
  }
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function hashIp(ip: string): string {
  const salt = getInternalApiSecret() ?? "rankflowhq";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function normalizePlan(plan: string | null | undefined): PlanId {
  return plan === "pro" || plan === "scale" || plan === "enterprise" ? plan : "free";
}

function monthBucket(now = new Date()): string {
  return `runs:${now.toISOString().slice(0, 7)}`;
}

function hourBucket(kind: UsageKind, now = new Date()): string {
  return `rl:${kind}:${now.toISOString().slice(0, 13)}`;
}

/** Atomically increments a counter and returns the new value. */
async function increment(subject: string, bucket: string): Promise<number> {
  const run = () =>
    prisma.usageCounter.upsert({
      where: { subject_bucket: { subject, bucket } },
      create: { subject, bucket, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
  try {
    return (await run()).count;
  } catch (e) {
    // Two concurrent first requests can race on create; the retry takes the update path.
    if ((e as { code?: string }).code === "P2002") return (await run()).count;
    throw e;
  }
}

function deny(status: number, error: string, extra?: Record<string, unknown>): GuardResult {
  return { ok: false, response: NextResponse.json({ error, ...extra }, { status }) };
}

export async function resolveUsageSubject(
  request: Request,
): Promise<{ subject: string; userId: string | null; plan: PlanId }> {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return { subject: `ip:${hashIp(clientIp(request))}`, userId: null, plan: "guest" };
  const profile = await prisma.userProfile.findUnique({
    where: { supabaseUserId: user.id },
    select: { plan: true },
  });
  return { subject: `u:${user.id}`, userId: user.id, plan: normalizePlan(profile?.plan) };
}

export async function getMonthlyRunUsage(subject: string): Promise<number> {
  const row = await prisma.usageCounter.findUnique({
    where: { subject_bucket: { subject, bucket: monthBucket() } },
    select: { count: true },
  });
  return row?.count ?? 0;
}

export async function guardUsage(request: Request, kind: UsageKind): Promise<GuardResult> {
  if (isInternalRequest(request) || (await isBlogAdmin())) {
    return { ok: true, ctx: { subject: "internal", userId: null, plan: "enterprise", unlimited: true } };
  }

  let who: Awaited<ReturnType<typeof resolveUsageSubject>>;
  try {
    who = await resolveUsageSubject(request);
  } catch (e) {
    console.error("[usage-guard] subject lookup failed", e);
    return deny(503, "Usage service unavailable. Please try again shortly.");
  }

  const ctx: UsageContext = { ...who, unlimited: false };
  const hourly = HOURLY_LIMITS[kind][who.userId ? "user" : "anon"];

  try {
    const used = await increment(who.subject, hourBucket(kind));
    if (used > hourly) {
      return deny(429, "Too many requests. Please wait a bit and try again.", { retryAfterMinutes: 60 - new Date().getUTCMinutes() });
    }

    const bringsOwnKey = Boolean(request.headers.get("x-gemini-key")?.trim());
    if (kind === "run" && !bringsOwnKey) {
      const limit = MONTHLY_RUN_LIMITS[who.plan];
      const runs = await increment(who.subject, monthBucket());
      if (runs > limit) {
        return deny(
          402,
          who.userId
            ? `You've used all ${limit} article runs on your ${who.plan} plan this month. Upgrade to keep generating.`
            : `Free trial limit reached (${limit} articles). Sign in to get ${MONTHLY_RUN_LIMITS.free} free runs per month.`,
          { code: who.userId ? "quota_exceeded" : "login_required", limit, plan: who.plan, upgradeUrl: "/pricing" },
        );
      }
    }
  } catch (e) {
    console.error("[usage-guard] counter update failed", e);
    return deny(503, "Usage service unavailable. Please try again shortly.");
  }

  return { ok: true, ctx };
}

/** For routes that must never be public (admin tools, write endpoints): blog admin or internal token only. */
export async function guardAdminOrInternal(request: Request): Promise<NextResponse | null> {
  if (isInternalRequest(request) || (await isBlogAdmin())) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
