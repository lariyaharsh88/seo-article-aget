import { NextResponse } from "next/server";
import { hashedIp, hitRateLimit } from "@/lib/rate-limit";
import { SiteDomain } from "@prisma/client";
import {
  fetchAllSitemaps,
  getUniqueSources,
  type NewsSourceProfile,
  siteDomainForNewsArticle,
} from "@/lib/education-news/fetchSitemaps";
import { runAutoRepurposeAfterSync } from "@/lib/education-news/auto-repurpose-after-sync";
import { syncEducationNewsArticles } from "@/lib/education-news/sync-stored";
import type { NewsArticle } from "@/lib/education-news/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 300;

/**
 * Public route: every miss fetches all sitemap sources, so responses are cached per domain
 * (in memory + CDN) and the DB sync / auto-repurpose runs at most once per SYNC_INTERVAL_MS.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const SYNC_INTERVAL_MS = 30 * 60 * 1000;
type NewsPayload = {
  articles: NewsArticle[];
  sources: unknown;
  timestamp: string;
};
const cache = new Map<SiteDomain, { at: number; data: Promise<NewsPayload> }>();
let lastSyncAt = 0;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
};

export async function GET(request: Request) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const requestedDomain =
    host === "education.rankflowhq.com"
      ? SiteDomain.education
      : SiteDomain.main;

  if (!hitRateLimit(`education-news:${hashedIp(request)}`, 120)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const hit = cache.get(requestedDomain);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    try {
      return NextResponse.json(await hit.data, { headers: CACHE_HEADERS });
    } catch {
      cache.delete(requestedDomain);
    }
  }

  const data = loadNews(requestedDomain);
  cache.set(requestedDomain, { at: Date.now(), data });
  try {
    return NextResponse.json(await data, { headers: CACHE_HEADERS });
  } catch (error) {
    cache.delete(requestedDomain);
    console.error("Error in education-news API:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", articles: [], sources: [] },
      { status: 500 },
    );
  }
}

async function loadNews(requestedDomain: SiteDomain): Promise<NewsPayload> {
  {
    const [educationArticles, seoArticles] = await Promise.all([
      fetchAllSitemaps("education"),
      fetchAllSitemaps("seo"),
    ]);

    const mergedByUrl = new Map<string, NewsArticle>();
    const pushForDomain = (
      rows: NewsArticle[],
      profile: NewsSourceProfile,
      domain: SiteDomain,
    ) => {
      for (const article of rows) {
        if (siteDomainForNewsArticle(article, profile) !== domain) continue;
        const existing = mergedByUrl.get(article.url);
        if (!existing) {
          mergedByUrl.set(article.url, article);
          continue;
        }
        const nextTs = Date.parse(article.lastmod);
        const prevTs = Date.parse(existing.lastmod);
        if (
          Number.isFinite(nextTs) &&
          Number.isFinite(prevTs) &&
          nextTs > prevTs
        ) {
          mergedByUrl.set(article.url, article);
        }
      }
    };

    pushForDomain(educationArticles, "education", requestedDomain);
    pushForDomain(seoArticles, "seo", requestedDomain);

    const articles = Array.from(mergedByUrl.values()).sort(
      (a, b) => Date.parse(b.lastmod) - Date.parse(a.lastmod),
    );
    const sources = getUniqueSources(articles);

    if (Date.now() - lastSyncAt > SYNC_INTERVAL_MS) {
      lastSyncAt = Date.now();
      try {
        await Promise.all([
          syncEducationNewsArticles(educationArticles, "education"),
          syncEducationNewsArticles(seoArticles, "seo"),
        ]);
        await runAutoRepurposeAfterSync();
      } catch (syncErr) {
        console.error("[education-news] sync / auto-repurpose:", syncErr);
      }
    }

    return { articles, sources, timestamp: new Date().toISOString() };
  }
}
