import type { NewsArticle } from "@/lib/education-news/types";
import { prisma } from "@/lib/prisma";

/**
 * Upsert today’s sitemap rows into Postgres (does not clear repurposed drafts).
 */
export async function syncEducationNewsArticles(
  articles: NewsArticle[],
): Promise<void> {
  for (const a of articles) {
    if (!a.url?.trim()) continue;
    await prisma.educationNewsArticle.upsert({
      where: { url: a.url.trim() },
      create: {
        url: a.url.trim(),
        title: a.title.slice(0, 500),
        source: a.source.slice(0, 120),
        lastmod: a.lastmod.slice(0, 80),
        repurposeStatus: "pending",
      },
      update: {
        title: a.title.slice(0, 500),
        source: a.source.slice(0, 120),
        lastmod: a.lastmod.slice(0, 80),
      },
    });
  }
}
