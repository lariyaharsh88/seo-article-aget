/**
 * Canonical origin for metadata, sitemap, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (no trailing slash). Include a scheme
 * (`https://`) or we prepend `https://` for host-only values.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const trimmed = fromEnv.replace(/\/$/, "");
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    try {
      const u = new URL(withProto);
      return u.origin + (u.pathname !== "/" ? u.pathname.replace(/\/$/, "") : "");
    } catch {
      /* bad env — fall through */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

/** Safe for `metadataBase`; never throws (invalid env falls back to localhost). */
export function getMetadataBaseUrl(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}
