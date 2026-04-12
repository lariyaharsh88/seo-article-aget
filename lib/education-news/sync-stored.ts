import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import type { NewsArticle } from "@/lib/education-news/types";
import { shouldSkipEducationNewsSourceUrl } from "@/lib/education-news/url-filters";
import { prisma } from "@/lib/prisma";

export type EducationNewsSyncResult = {
  /** New DB rows from this sync (`createdAt` ≥ sync start), still `pending`. Newest first. */
  newPendingIds: string[];
};

/**
 * Upsert today’s sitemap rows into Postgres (does not clear repurposed drafts).
 * Returns ids of rows **created** in this run for optional auto-repurpose.
 */
export async function syncEducationNewsArticles(
  articles: NewsArticle[],
): Promise<EducationNewsSyncResult> {
  const syncStarted = new Date();
  for (const a of articles) {
    const url = a.url?.trim();
    if (!url || shouldSkipEducationNewsSourceUrl(url)) continue;
    await prisma.educationNewsArticle.upsert({
      where: { url },
      create: {
        url,
        title: a.title.slice(0, 500),
        source: a.source.slice(0, 120),
        lastmod: a.lastmod.slice(0, 80),
        authorName: DEFAULT_ARTICLE_AUTHOR_NAME,
        repurposeStatus: "pending",
      },
      update: {
        title: a.title.slice(0, 500),
        source: a.source.slice(0, 120),
        lastmod: a.lastmod.slice(0, 80),
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
