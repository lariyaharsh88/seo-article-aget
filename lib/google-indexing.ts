/**
 * Best-effort HTTP GET to Google's legacy sitemap ping URL (`/ping?sitemap=`).
 * Google may ignore or rate-limit this; it does **not** guarantee crawl frequency or
 * update the “Last read” date in Search Console on a fixed schedule. Prefer accurate
 * `<lastmod>` in sitemaps, Search Console URL Inspection for critical URLs, and
 * (for Bing et al.) IndexNow. Safe to call from publish hooks and optional cron.
 */
export async function notifyGoogleSitemaps(opts: {
  siteOrigin: string;
  sitemapPaths: string[];
}): Promise<void> {
  const origin = opts.siteOrigin.replace(/\/$/, "");
  const unique = Array.from(new Set(opts.sitemapPaths));
  for (const p of unique) {
    const path = p.startsWith("/") ? p : `/${p}`;
    const sitemapUrl = `${origin}${path}`;
    const ping = `https://www.google.com/ping?sitemap=${encodeURIComponent(
      sitemapUrl,
    )}`;
    try {
      await fetch(ping, { method: "GET" });
    } catch (e) {
      console.error("[google-ping] failed:", sitemapUrl, e);
    }
  }
}
