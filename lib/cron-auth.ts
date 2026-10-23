import { timingSafeEqual } from "node:crypto";

/**
 * Cron endpoints accept only `Authorization: Bearer $CRON_SECRET` — the header Vercel Cron
 * sends automatically when CRON_SECRET is set. `x-vercel-cron` is not trusted: any client can send it.
 * Without CRON_SECRET, crons run only outside production (local dev).
 */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
