import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import type { NewsSourceProfile } from "@/lib/education-news/fetchSitemaps";
import { siteDomainForNewsArticle } from "@/lib/education-news/fetchSitemaps";
import type { NewsArticle } from "@/lib/education-news/types";
import { shouldSkipEducationNewsSourceUrl } from "@/lib/education-news/url-filters";
import { prisma } from "@/lib/prisma";

export type EducationNewsSyncResult = {
  /** New DB rows from this sync (`createdAt` ≥ sync start), still `pending`. Newest first. */
  newPendingIds: string[];
};

/**
 * Upsert today’s sitemap rows into Postgres (does not clear repurposed drafts).
 * Each row’s `siteDomain` is set from the feed `source` name and sync profile — see `siteDomainForNewsSource`.
 */
export async function syncEducationNewsArticles(
  articles: NewsArticle[],
  profile: NewsSourceProfile,
): Promise<EducationNewsSyncResult> {
  const syncStarted = new Date();
  for (const a of articles) {
    const url = a.url?.trim();
    if (!url || shouldSkipEducationNewsSourceUrl(url)) continue;
    const siteDomain = siteDomainForNewsArticle(a, profile);
    await prisma.educationNewsArticle.upsert({
      where: { url },
      create: {
        url,
        title: a.title.slice(0, 500),
        source: a.source.slice(0, 120),
        lastmod: a.lastmod.slice(0, 80),
        authorName: DEFAULT_ARTICLE_AUTHOR_NAME,
        repurposeStatus: "pending",
        siteDomain,
      },
      update: {
        title: a.title.slice(0, 500),
        source: a.source.slice(0, 120),
        lastmod: a.lastmod.slice(0, 80),
        siteDomain,
      },
    });
  }

  const fresh = await prisma.educationNewsArticle.findMany({
    where: {
      createdAt: { gte: syncStarted },
      repurposeStatus: "pending",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return { newPendingIds: fresh.map((r) => r.id) };
}
