import { createHash, timingSafeEqual } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

/**
 * Protects routes that spend our server-side provider keys (Gemini, Groq, OpenRouter, Tavily, Serper…).
 *
 * Allowed callers:
 * - server-to-server calls carrying `x-internal-token` (admin bulk pipelines)
 * - the blog admin (NextAuth session)
 * - signed-in Supabase users (`Authorization: Bearer <access token>`)
 * - anonymous callers only when `allowAnonymous` is set (public site chat)
 *
 * Every caller is also rate limited per IP / user. The limiter is in-memory, so on serverless it is
 * per instance — a speed bump against abuse, not a billing guarantee. Auth is the real gate.
 */
export const INTERNAL_TOKEN_HEADER = "x-internal-token";

export function getInternalApiSecret(): string | undefined {
  return (
    process.env.INTERNAL_API_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || undefined
  );
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function isInternalRequest(request: Request): boolean {
  const secret = getInternalApiSecret();
  const token = request.headers.get(INTERNAL_TOKEN_HEADER)?.trim();
  return Boolean(secret && token && safeEqual(token, secret));
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip")?.trim() || "unknown";
}

const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function hit(key: string, limit: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    buckets.forEach((v, k) => {
      if (v.resetAt <= now) buckets.delete(k);
    });
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export type PaidRouteOptions = {
  /** Allow callers with no session and no own key (still rate limited). */
  allowAnonymous?: boolean;
  /** Requests per hour for anonymous callers. */
  anonLimit?: number;
  /** Requests per hour for signed-in users. */
  userLimit?: number;
};

/** Returns a response to send back when the request must be rejected, or null when allowed. */
export async function guardPaidRoute(
  request: Request,
  opts: PaidRouteOptions = {},
): Promise<NextResponse | null> {
  if (isInternalRequest(request)) return null;

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) return null;
  } catch {
    // NextAuth not configured — fall through.
  }

  const route = new URL(request.url).pathname;
  const anonLimit = opts.anonLimit ?? 30;
  const userLimit = opts.userLimit ?? 300;

  const user = await getSupabaseUserFromRequest(request).catch(() => null);
  if (user) {
    return hit(`u:${user.id}:${route}`, userLimit) ? null : tooMany();
  }

  if (!opts.allowAnonymous) {
    return NextResponse.json(
      { error: "Sign in to use this tool." },
      { status: 401 },
    );
  }
  const ipKey = createHash("sha256").update(clientIp(request)).digest("hex").slice(0, 24);
  return hit(`ip:${ipKey}:${route}`, anonLimit) ? null : tooMany();
}

function tooMany(): NextResponse {
  return NextResponse.json(
    { error: "Rate limit reached. Please try again later." },
    { status: 429, headers: { "Retry-After": "3600" } },
  );
}
