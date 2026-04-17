import { getSiteUrl } from "@/lib/site-url";

export type RssSubmissionChecklistItem = {
  id: string;
  label: string;
  action: "ping" | "manual" | "api";
  /** Human-readable URL or description */
  href: string;
  notes: string;
};

/**
 * RSS / feed discovery hints. Most aggregators require **manual** submission once;
 * pings help crawlers that still listen (limited SEO impact vs quality links).
 */
export function buildRssSubmissionChecklist(): RssSubmissionChecklistItem[] {
  const base = getSiteUrl().replace(/\/$/, "");
  const feedUrl = `${base}/feed.xml`;
  const sitemapUrl = `${base}/sitemap.xml`;

  return [
    {
      id: "google_search_console",
      label: "Google Search Console — sitemap",
      action: "manual",
      href: "https://search.google.com/search-console",
      notes: `Submit ${sitemapUrl} under Sitemaps (primary discovery for Google).`,
    },
    {
      id: "bing_webmaster",
      label: "Bing Webmaster Tools — sitemap",
      action: "manual",
      href: "https://www.bing.com/webmasters",
      notes: `Submit ${sitemapUrl}; enables Bing + partner syndication.`,
    },
    {
      id: "indexnow",
      label: "IndexNow (Bing, Yandex, others)",
      action: "api",
      href: "https://www.indexnow.org/",
      notes: "Use existing INDEXNOW_KEY + server ping when URLs publish (already supported in codebase).",
    },
    {
      id: "feed_url",
      label: "Public RSS feed URL",
      action: "manual",
      href: feedUrl,
      notes: "Use this URL when a directory asks for ‘RSS feed’; ensure /feed.xml returns 200.",
    },
    {
      id: "aggregators",
      label: "RSS directories (optional, declining value)",
      action: "manual",
      href: "https://rss.feedspot.com/ (example directory)",
      notes: "Submit feed once; prioritize GSC + real backlinks over mass directory spam.",
    },
  ];
}
