import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  try {
    const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
    const requestedDomain =
      host === "education.rankflowhq.com" || host === "education.rankflohq.com"
        ? SiteDomain.education
        : SiteDomain.main;

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
        if (Number.isFinite(nextTs) && Number.isFinite(prevTs) && nextTs > prevTs) {
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

    try {
      await Promise.all([
        syncEducationNewsArticles(educationArticles, "education"),
        syncEducationNewsArticles(seoArticles, "seo"),
      ]);
      await runAutoRepurposeAfterSync();
    } catch (syncErr) {
      console.error("[education-news] sync / auto-repurpose:", syncErr);
    }

    return NextResponse.json({
      articles,
      sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in education-news API:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", articles: [], sources: [] },
      { status: 500 },
    );
  }
}
