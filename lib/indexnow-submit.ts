import { getSiteUrl } from "@/lib/site-url";

/**
 * IndexNow notifies Bing, Yandex, Naver, and other partners when URLs change.
 * Google does **not** use IndexNow; it crawls sitemaps submitted in Search Console.
 *
 * Requires `INDEXNOW_KEY` + `INDEXNOW_KEY_URL` (HTTPS URL of a text file on your
 * domain whose contents equal the key). See https://www.indexnow.org/documentation
 */
export function getNewsSitemapAbsoluteUrl(): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/news/sitemap.xml`;
}

export type IndexNowNotifyOpts = {
  /** Canonical URL of the published news article (e.g. https://example.com/news/slug). */
  articleUrl: string;
  /** Also submit the news sitemap URL (same host). Default from env INDEXNOW_INCLUDE_NEWS_SITEMAP. */
  includeNewsSitemap?: boolean;
};

/**
 * Fire-and-forget IndexNow POST. Never throws; logs failures.
 */
export async function notifyIndexNowIfConfigured(
  opts: IndexNowNotifyOpts,
): Promise<void> {
  const key = process.env.INDEXNOW_KEY?.trim();
  const keyLocation = process.env.INDEXNOW_KEY_URL?.trim();
  if (!key || !keyLocation) {
    return;
  }

  const envSitemap = process.env.INDEXNOW_INCLUDE_NEWS_SITEMAP?.trim();
  const sitemapOff =
    envSitemap === "0" || envSitemap?.toLowerCase() === "false";
  /** Default: include `/news/sitemap.xml` with the article URL (opt out with INDEXNOW_INCLUDE_NEWS_SITEMAP=false). */
  const fromEnv = !sitemapOff;
  const includeSitemap =
    opts.includeNewsSitemap !== undefined
      ? opts.includeNewsSitemap
      : fromEnv;

  const urlList = [opts.articleUrl.trim()];
  if (includeSitemap) {
    const sm = getNewsSitemapAbsoluteUrl();
    if (!urlList.includes(sm)) urlList.push(sm);
  }

  let host: string;
  try {
    host = new URL(keyLocation).hostname;
  } catch {
    console.error("[indexnow] INDEXNOW_KEY_URL is not a valid URL");
    return;
  }

  const body = JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  });

  const endpoints = [
    "https://api.indexnow.org/IndexNow",
    "https://www.bing.com/indexnow",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error(`[indexnow] ${url} → ${res.status}`, t.slice(0, 500));
      }
    } catch (e) {
      console.error(`[indexnow] ${url} fetch failed:`, e);
    }
  }
}
