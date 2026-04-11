/**
 * Supabase **transaction pooler** (port 6543) works reliably with Prisma only when the
 * connection string includes `pgbouncer=true` and a low `connection_limit` for serverless.
 * Many timeouts on Vercel are fixed by adding these — users often paste the host only.
 *
 * @see https://www.prisma.io/docs/orm/overview/databases/supabase
 */
export function getEffectiveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;

  if (!/pooler\.supabase\.com/i.test(url)) {
    return url;
  }

  const hasParam = (name: string) =>
    new RegExp(`[?&]${name}=`, "i").test(url);

  let out = url;
  const append = (fragment: string) => {
    out += (out.includes("?") ? "&" : "?") + fragment;
  };

  if (!hasParam("pgbouncer")) append("pgbouncer=true");
  if (!hasParam("connection_limit")) append("connection_limit=1");
  if (!hasParam("connect_timeout")) append("connect_timeout=20");
  if (!hasParam("sslmode")) append("sslmode=require");

  return out;
}
