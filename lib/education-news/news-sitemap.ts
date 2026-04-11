import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

/**
 * URLs for `/news` index and each published repurposed article.
 * Consumed by `app/news/sitemap.ts` (Next serves `/news/sitemap.xml`).
 */
export async function getNewsSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, "");

  let articles: { slug: string; updatedAt: Date }[] = [];
  try {
    const rows = await prisma.educationNewsArticle.findMany({
      where: {
        repurposeStatus: "ready",
        repurposedSlug: { not: null },
        repurposedMarkdown: { not: null },
        repurposedAt: { not: null },
      },
      select: { repurposedSlug: true, updatedAt: true },
      orderBy: { repurposedAt: "desc" },
    });
    articles = rows
      .filter((r) => Boolean(r.repurposedSlug?.trim()))
      .map((r) => ({
        slug: r.repurposedSlug!.trim(),
        updatedAt: r.updatedAt,
      }));
  } catch {
    articles = [];
  }

  const latest =
    articles.length > 0
      ? new Date(Math.max(...articles.map((a) => a.updatedAt.getTime())))
      : new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${base}/news`,
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.72,
    },
  ];

  for (const a of articles) {
    routes.push({
      url: `${base}/news/${encodeURIComponent(a.slug)}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly",
      priority: 0.64,
    });
  }

  return routes;
}
