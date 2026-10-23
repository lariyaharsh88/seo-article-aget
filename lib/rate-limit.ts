import { createHash } from "node:crypto";

/**
 * Fixed-window in-memory rate limiter. On serverless it is per instance — a speed bump
 * against abuse and spam, not a hard guarantee.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashedIp(request: Request): string {
  return createHash("sha256").update(clientIp(request)).digest("hex").slice(0, 24);
}

/** Counts one hit for `key`; returns false once `limit` is exceeded within `windowMs`. */
export function hitRateLimit(key: string, limit: number, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    buckets.forEach((v, k) => {
      if (v.resetAt <= now) buckets.delete(k);
    });
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}
