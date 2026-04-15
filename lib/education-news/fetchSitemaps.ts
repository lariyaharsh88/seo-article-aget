import { SiteDomain } from "@prisma/client";
import { XMLParser } from "fast-xml-parser";
import type { NewsArticle, SitemapSource } from "./types";
import { shouldSkipEducationNewsSourceUrl } from "./url-filters";

const EDUCATION_SITEMAP_SOURCES: SitemapSource[] = [
  { url: "https://www.shiksha.com/NewsIndex1.xml", name: "Shiksha" },
  {
    url: "https://collegedunia.com/sitemap-news-updates.xml",
    name: "CollegeDunia",
  },
  { url: "https://news.careers360.com/news-sitemap.xml", name: "Careers360" },
  {
    url: "https://www.jagranjosh.com/newsitemap-news-english.xml",
    name: "Jagran Josh",
  },
  { url: "https://testbook.com/news/post-sitemap.xml", name: "Testbook" },
];

const SEO_SITEMAP_SOURCES: SitemapSource[] = [
  { url: "https://ahrefs.com/blog/feed/", name: "Ahrefs Blog" },
  { url: "https://rss.searchenginejournal.com/", name: "SEJ RSS" },
  { url: "https://techcrunch.com/news-sitemap.xml", name: "TechCrunch News Sitemap" },
  { url: "https://www.theverge.com/sitemaps/entries/2026/4", name: "The Verge Entries" },
  { url: "https://www.searchenginejournal.com/news-sitemap.xml", name: "SEJ News Sitemap" },
  { url: "https://www.seopress.org/post-sitemap1.xml", name: "SEOPress Posts" },
  { url: "https://searchengineland.com/post-sitemap.xml", name: "Search Engine Land Posts" },
  { url: "https://www.searchenginejournal.com/post-sitemap.xml", name: "SEJ Posts Sitemap" },
  { url: "https://moz.com/sitemaps-1-section-blog-1-sitemap-p1.xml", name: "Moz Blog Sitemap" },
  { url: "https://feedpress.me/mozblog", name: "Moz Feed" },
  { url: "https://techcrunch.com/feed/", name: "TechCrunch Feed" },
];

export type NewsSourceProfile = "education" | "seo";

const EDUCATION_SOURCE_NAMES = new Set(
  EDUCATION_SITEMAP_SOURCES.map((s) => s.name),
);
const SEO_SOURCE_NAMES = new Set(SEO_SITEMAP_SOURCES.map((s) => s.name));

/** Main-domain news should stay focused on AI/SEO updates only. */
const MAIN_AI_SEO_TOPIC_RE =
  /\b(ai|seo|search engine|search ranking|serp|google update|core update|algorithm|backlink|link building|content marketing|llm|chatgpt|openai|gemini|claude|anthropic|perplexity|programmatic seo|generative engine optimization|geo)\b/i;

/**
 * `siteDomain` for a row from its feed `source` label and which sitemap profile was synced.
 * Unknown `source` values follow the profile (education subdomain vs main SEO feeds).
 */
export function siteDomainForNewsSource(
  source: string,
  profile: NewsSourceProfile,
): SiteDomain {
  const name = source.trim();
  if (SEO_SOURCE_NAMES.has(name)) return SiteDomain.main;
  if (EDUCATION_SOURCE_NAMES.has(name)) return SiteDomain.education;
  return profile === "education" ? SiteDomain.education : SiteDomain.main;
}

/**
 * Final domain routing for a fetched article.
 * - Known education feeds always remain on the education domain.
 * - Known SEO feeds are heuristically split: edtech/exam stories -> education, else main.
 */
export function siteDomainForNewsArticle(
  article: Pick<NewsArticle, "source" | "title" | "url">,
  profile: NewsSourceProfile,
): SiteDomain {
  const sourceDomain = siteDomainForNewsSource(article.source, profile);
  if (sourceDomain === SiteDomain.education) return SiteDomain.education;
  const topicText = `${article.source}\n${article.title}\n${article.url}`;
  return MAIN_AI_SEO_TOPIC_RE.test(topicText)
    ? SiteDomain.main
    : SiteDomain.education;
}

function sourcesForProfile(profile: NewsSourceProfile): SitemapSource[] {
  return profile === "education" ? EDUCATION_SITEMAP_SOURCES : SEO_SITEMAP_SOURCES;
}

function getTodayIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Strip URL-only noise (e.g. `alertid-150371`) from slug-derived titles. */
function scrubUrlDerivedTitle(title: string): string {
  const cleaned = title
    .replace(/\b(alertid|alert-id)\s*-?\s*\d+\b/gi, "")
    .replace(/\s*[-–—]\s*(alertid|alert-id)\s*-?\s*\d+\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Untitled Article";
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    let slug = lastSegment.replace(/\.(html|htm|php|aspx?)$/i, "");
    slug = slug.replace(/(?:^|-)(alertid|alert-id)-?\d+(?:$|-)/gi, "-");
    slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");
    const title = slug
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return scrubUrlDerivedTitle(title || "Untitled Article");
  } catch {
    return "Untitled Article";
  }
}

function normalizeNewsTitle(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** fast-xml-parser may return a string or `{ "#text": "..." }` when attributes exist. */
function xmlScalar(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object" && "#text" in (v as object)) {
    const t = (v as { "#text": unknown })["#text"];
    if (typeof t === "string") return t.trim();
  }
  return "";
}

/** Prefer `<news:title>` from Google News sitemaps; fallback to cleaned URL-derived title. */
function extractTitleFromSitemapItem(
  item: Record<string, unknown>,
  url: string,
): string {
  const tryString = (v: unknown): string | null => {
    const s = xmlScalar(v);
    if (s) return normalizeNewsTitle(s);
    return null;
  };

  const direct =
    tryString(item["news:title"]) ??
    tryString(item.title);
  if (direct) return direct;

  const wrapped = item["news:news"];
  if (wrapped && typeof wrapped === "object") {
    if (Array.isArray(wrapped)) {
      for (const block of wrapped) {
        if (block && typeof block === "object") {
          const t = tryString(
            (block as Record<string, unknown>)["news:title"],
          );
          if (t) return t;
        }
      }
    } else {
      const t = tryString(
        (wrapped as Record<string, unknown>)["news:title"],
      );
      if (t) return t;
    }
  }

  return extractTitleFromUrl(url);
}

function getPublicationOrLastMod(
  item: Record<string, unknown>,
): string {
  const top =
    xmlScalar(item.lastmod) || xmlScalar(item["news:publication_date"]);
  if (top) return top;
  const wrapped = item["news:news"];
  if (wrapped && typeof wrapped === "object") {
    if (Array.isArray(wrapped)) {
      for (const block of wrapped) {
        if (block && typeof block === "object") {
          const d = xmlScalar(
            (block as Record<string, unknown>)["news:publication_date"],
          );
          if (d) return d;
        }
      }
    } else {
      const d = xmlScalar(
        (wrapped as Record<string, unknown>)["news:publication_date"],
      );
      if (d) return d;
    }
  }
  return "";
}

function parseRssLikeResponse(
  result: Record<string, unknown>,
  source: SitemapSource,
): NewsArticle[] {
  const fromRss = ((): Record<string, unknown>[] => {
    const channel = (result.rss as Record<string, unknown> | undefined)?.channel;
    if (!channel || typeof channel !== "object") return [];
    const item = (channel as Record<string, unknown>).item;
    if (!item) return [];
    return (Array.isArray(item) ? item : [item]).filter(
      (v): v is Record<string, unknown> => Boolean(v && typeof v === "object"),
    );
  })();

  const fromAtom = ((): Record<string, unknown>[] => {
    const feed = result.feed;
    if (!feed || typeof feed !== "object") return [];
    const entry = (feed as Record<string, unknown>).entry;
    if (!entry) return [];
    return (Array.isArray(entry) ? entry : [entry]).filter(
      (v): v is Record<string, unknown> => Boolean(v && typeof v === "object"),
    );
  })();

  const rows = fromRss.length > 0 ? fromRss : fromAtom;
  if (rows.length === 0) return [];

  return rows
    .map((item) => {
      const linkRaw = item.link;
      const url =
        typeof linkRaw === "string"
          ? linkRaw
          : linkRaw && typeof linkRaw === "object"
            ? xmlScalar((linkRaw as Record<string, unknown>)["@_href"]) ||
              xmlScalar((linkRaw as Record<string, unknown>)["#text"])
            : "";
      const pubDate =
        xmlScalar(item.pubDate) ||
        xmlScalar(item.published) ||
        xmlScalar(item.updated) ||
        xmlScalar(item.lastmod);
      const title = xmlScalar(item.title) || extractTitleFromUrl(url);
      return {
        url,
        lastmod: pubDate,
        source: source.name,
        title: normalizeNewsTitle(title).slice(0, 500),
        lastModifiedTime: formatLastModTime(pubDate),
      } satisfies NewsArticle;
    })
    .filter(
      (item) =>
        Boolean(item.url) &&
        Boolean(item.lastmod) &&
        !shouldSkipEducationNewsSourceUrl(item.url) &&
        isToday(item.lastmod),
    );
}

export function formatLastModTime(lastmod: string): string {
  try {
    const date = new Date(lastmod);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleTimeString("en-IN", options);
  } catch {
    return "Unknown time";
  }
}

export function isToday(dateString: string): boolean {
  try {
    const today = getTodayIST();
    const articleDate = dateString.split("T")[0];
    return articleDate === today;
  } catch {
    return false;
  }
}

async function fetchSingleSitemap(
  source: SitemapSource,
): Promise<NewsArticle[]> {
  try {
    const options: RequestInit = {
      next: { revalidate: 0 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/xml,text/xml,*/*;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    };

    const response = await fetch(source.url, options);

    if (!response.ok) {
      console.error(`Failed to fetch ${source.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    return parseSitemapResponse(xmlText, source);
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error);
    return [];
  }
}

function parseSitemapResponse(
  xmlText: string,
  source: SitemapSource,
): NewsArticle[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const result = parser.parse(xmlText);

    const rssArticles = parseRssLikeResponse(result as Record<string, unknown>, source);
    if (rssArticles.length > 0) return rssArticles;

    let urls: unknown[] = [];

    if (result.urlset?.url) {
      urls = Array.isArray(result.urlset.url)
        ? result.urlset.url
        : [result.urlset.url];
    } else if (result.sitemapindex?.sitemap) {
      urls = Array.isArray(result.sitemapindex.sitemap)
        ? result.sitemapindex.sitemap
        : [result.sitemapindex.sitemap];
    }

    const rows = urls as Record<string, unknown>[];

    const articles: NewsArticle[] = rows
      .filter((item) => {
        const url = xmlScalar(item.loc);
        if (!url || shouldSkipEducationNewsSourceUrl(url)) return false;
        const lastmod = getPublicationOrLastMod(item);
        return Boolean(lastmod && isToday(lastmod));
      })
      .map((item) => {
        const url = xmlScalar(item.loc);
        const lastmod = getPublicationOrLastMod(item);

        return {
          url,
          lastmod,
          source: source.name,
          title: extractTitleFromSitemapItem(item, url).slice(0, 500),
          lastModifiedTime: formatLastModTime(lastmod),
        };
      });

    return articles;
  } catch (error) {
    console.error(`Error parsing ${source.name} sitemap:`, error);
    return [];
  }
}

export async function fetchAllSitemaps(
  profile: NewsSourceProfile = "seo",
): Promise<NewsArticle[]> {
  const sources = sourcesForProfile(profile);
  try {
    const results = await Promise.allSettled(
      sources.map((source) => fetchSingleSitemap(source)),
    );

    const allArticles: NewsArticle[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      } else {
        console.error(
          `Failed to fetch ${sources[index].name}:`,
          result.reason,
        );
      }
    });

    allArticles.sort((a, b) => {
      return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
    });

    return allArticles;
  } catch (error) {
    console.error("Error fetching sitemaps:", error);
    return [];
  }
}

export function getUniqueSources(articles: NewsArticle[]): string[] {
  const sources = new Set(articles.map((article) => article.source));
  return Array.from(sources).sort();
}
