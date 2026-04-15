import type { MetadataRoute } from "next";
import { SiteDomain } from "@prisma/client";
import { getProgrammaticKeywordPages } from "@/lib/programmatic-ai-seo";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/seo-agent`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${base}/repurpose-url`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
    },
    {
      url: `${base}/ai-seo-toolkit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${base}/off-page-seo`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/ai-seo-tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
    },
    {
      url: `${base}/keyword-clustering-tool`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${base}/free-tools/keyword-clustering`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/free-tools/llms-txt-generator`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: `${base}/free-tools/ai-search-grader`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: `${base}/free-tools/keyword-extractor`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  const programmatic = getProgrammaticKeywordPages().map((item) => ({
    url: `${base}/blog/ai-seo/${item.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  const [mainNews, mainShared] = await Promise.all([
    prisma.educationNewsArticle.findMany({
      where: {
        repurposeStatus: "ready",
        repurposedSlug: { not: null },
        siteDomain: SiteDomain.main,
      },
      select: { repurposedSlug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.sharedArticle.findMany({
      where: { siteDomain: SiteDomain.main },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
  ]);

  const newsUrls: MetadataRoute.Sitemap = [
    {
      url: `${base}/news`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${base}/blogs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...mainNews
      .filter((r) => Boolean(r.repurposedSlug?.trim()))
      .map((r) => ({
        url: `${base}/news/${encodeURIComponent(r.repurposedSlug!.trim())}`,
        lastModified: r.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    ...mainShared.map((r) => ({
      url: `${base}/article/${encodeURIComponent(r.slug)}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  /* Blog posts: `app/blogs/sitemap.xml/route.ts`. See robots.ts. */

  return [...routes, ...programmatic, ...newsUrls];
}
