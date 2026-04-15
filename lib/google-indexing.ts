/**
 * Google does not support IndexNow. This helper pings Google's sitemap endpoint
 * to nudge faster recrawl after new publishes.
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
