import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "@/lib/education-news/types";

type MonitorSource = {
  name: string;
  url: string;
};

const OFFICIAL_SOURCES: MonitorSource[] = [
  { name: "UPSC", url: "https://www.upsc.gov.in/rss.xml" },
  { name: "CBSE", url: "https://www.cbse.gov.in/cbsenew/rss.xml" },
  { name: "RRB", url: "https://www.rrbcdg.gov.in/rrb_rss.xml" },
  { name: "SSC", url: "https://ssc.gov.in/rss" },
  { name: "Bihar Board", url: "https://biharboardonline.com/rss.xml" },
];

const GOOGLE_NEWS_QUERIES = [
  "SSC result",
  "UPSC admit card",
  "RRB exam date",
  "CBSE board result",
  "state board result",
  "admit card released",
  "exam date notification",
];

const GOOGLE_NEWS_SOURCES: MonitorSource[] = GOOGLE_NEWS_QUERIES.map((q) => ({
  name: `Google News: ${q}`,
  url: `https://news.google.com/rss/search?q=${encodeURIComponent(
    `${q} when:1d`,
  )}&hl=en-IN&gl=IN&ceid=IN:en`,
}));

const ANNOUNCEMENT_RE =
  /\b(result|results|admit card|hall ticket|exam date|schedule|timetable|notification|answer key|merit list)\b/i;

const KEY_DATE_RE =
  /\b(\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{2,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/i;

function xmlText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object" && "#text" in (v as object)) {
    const t = (v as { "#text": unknown })["#text"];
    if (typeof t === "string") return t.trim();
  }
  return "";
}

function extractLink(item: Record<string, unknown>): string {
  const raw = item.link;
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const href = xmlText((raw as Record<string, unknown>)["@_href"]);
    if (href) return href;
    const txt = xmlText((raw as Record<string, unknown>)["#text"]);
    if (txt) return txt;
  }
  return "";
}

function inferAnnouncementTag(title: string): string {
  const t = title.toLowerCase();
  if (/\bresult|results|merit list\b/.test(t)) return "Result";
  if (/\badmit card|hall ticket\b/.test(t)) return "Admit Card";
  if (/\bexam date|schedule|timetable\b/.test(t)) return "Exam Date";
  return "Notification";
}

function extractKeyDetailSnippet(title: string): string {
  const date = KEY_DATE_RE.exec(title)?.[1];
  const year = /\b(20\d{2})\b/.exec(title)?.[1];
  const detailBits = [date, year].filter(Boolean).join(" · ");
  return detailBits ? `${title} (${detailBits})` : title;
}

function parseFeed(xml: string, source: MonitorSource): NewsArticle[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const out: NewsArticle[] = [];

  const pushItem = (item: Record<string, unknown>) => {
    const titleRaw = xmlText(item.title) || "Untitled update";
    if (!ANNOUNCEMENT_RE.test(titleRaw)) return;

    const url = extractLink(item) || xmlText(item.loc);
    if (!url) return;
    const pub =
      xmlText(item.pubDate) ||
      xmlText(item.published) ||
      xmlText(item.updated) ||
      xmlText(item.lastmod) ||
      new Date().toISOString();
    const tag = inferAnnouncementTag(titleRaw);
    const title = `[${tag}] ${extractKeyDetailSnippet(titleRaw)}`.slice(0, 500);
    out.push({
      url,
      source: source.name,
      title,
      lastmod: pub,
      lastModifiedTime: new Date(pub).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    });
  };

  const rssItems = ((): Record<string, unknown>[] => {
    const channel = (parsed.rss as Record<string, unknown> | undefined)?.channel;
    if (!channel || typeof channel !== "object") return [];
    const item = (channel as Record<string, unknown>).item;
    if (!item) return [];
    return (Array.isArray(item) ? item : [item]).filter(
      (v): v is Record<string, unknown> => Boolean(v && typeof v === "object"),
    );
  })();
  const atomEntries = ((): Record<string, unknown>[] => {
    const feed = parsed.feed;
    if (!feed || typeof feed !== "object") return [];
    const entry = (feed as Record<string, unknown>).entry;
    if (!entry) return [];
    return (Array.isArray(entry) ? entry : [entry]).filter(
      (v): v is Record<string, unknown> => Boolean(v && typeof v === "object"),
    );
  })();
  const sitemapUrls = ((): Record<string, unknown>[] => {
    const urlset = (parsed.urlset as Record<string, unknown> | undefined)?.url;
    if (!urlset) return [];
    return (Array.isArray(urlset) ? urlset : [urlset]).filter(
      (v): v is Record<string, unknown> => Boolean(v && typeof v === "object"),
    );
  })();

  for (const row of rssItems) pushItem(row);
  for (const row of atomEntries) pushItem(row);
  for (const row of sitemapUrls) pushItem(row);

  return out;
}

async function fetchSource(source: MonitorSource): Promise<NewsArticle[]> {
  try {
    const res = await fetch(source.url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RankFlowHQ-NewsMonitor/1.0; +https://rankflowhq.com)",
        Accept: "application/xml,text/xml,application/rss+xml,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, source);
  } catch {
    return [];
  }
}

export async function fetchEducationMonitorArticles(): Promise<{
  articles: NewsArticle[];
  scannedSources: number;
  matchedAnnouncements: number;
}> {
  const sources = [...OFFICIAL_SOURCES, ...GOOGLE_NEWS_SOURCES];
  const results = await Promise.allSettled(sources.map((s) => fetchSource(s)));
  const merged = new Map<string, NewsArticle>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) {
      const prev = merged.get(item.url);
      if (!prev) {
        merged.set(item.url, item);
        continue;
      }
      if (Date.parse(item.lastmod) > Date.parse(prev.lastmod)) {
        merged.set(item.url, item);
      }
    }
  }
  const articles = Array.from(merged.values()).sort(
    (a, b) => Date.parse(b.lastmod) - Date.parse(a.lastmod),
  );
  return {
    articles,
    scannedSources: sources.length,
    matchedAnnouncements: articles.length,
  };
}
