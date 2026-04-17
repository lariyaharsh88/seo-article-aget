import type { MetadataRoute } from "next";
import { SiteDomain } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSeoLandingSlugs } from "@/lib/seo-landing-pages";
import { listStaticBlogPosts } from "@/lib/static-blog-posts";
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

  const staticBlogPosts = await listStaticBlogPosts();
  const blogMainUrls: MetadataRoute.Sitemap = [
    {
      url: `${base}/feed.xml`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.45,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
    },
    ...staticBlogPosts.map((p) => ({
      url: `${base}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const landingSlugs = getSeoLandingSlugs();
  const landingUrls: MetadataRoute.Sitemap = landingSlugs.map((slug) => ({
    url: `${base}/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  /** Shared articles generated on main (SaaS); not education news. */
  let mainShared: { slug: string; updatedAt: Date }[] = [];
  try {
    mainShared = await prisma.sharedArticle.findMany({
      where: { siteDomain: SiteDomain.main },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
  } catch {
    mainShared = [];
  }

  const articleUrls: MetadataRoute.Sitemap = mainShared.map((r) => ({
    url: `${base}/article/${encodeURIComponent(r.slug)}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  /* Education news lives on education.rankflowhq.com; do not list /news on main (would 301). */
  /* Blog mirrors: `app/blogs/sitemap.xml/route.ts` — legacy `/blogs` URLs 308 → `/blog`. */

  return [...routes, ...landingUrls, ...blogMainUrls, ...articleUrls];
}
