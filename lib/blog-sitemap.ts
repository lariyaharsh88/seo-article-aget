import { SiteDomain } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listStaticBlogPosts } from "@/lib/static-blog-posts";
import { getSiteUrl } from "@/lib/site-url";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type BlogSitemapRow = { loc: string; lastmod: Date; priority: number };

const STATIC_BLOG_LASTMOD = new Date("2026-01-01T00:00:00.000Z");

/** Published `/blogs` index + each post URL for sitemaps (any origin). */
export async function getPublishedBlogSitemapRows(
  base: string,
  siteDomain: SiteDomain,
): Promise<BlogSitemapRow[]> {
  const b = base.replace(/\/$/, "");

  let posts: { slug: string; updatedAt: Date }[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true, siteDomain },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    posts = [];
  }

  const dbSlugSet = new Set(posts.map((p) => p.slug));
  const times: number[] = posts.map((p) => p.updatedAt.getTime());
  if (siteDomain === SiteDomain.main) {
    const staticList = await listStaticBlogPosts();
    times.push(STATIC_BLOG_LASTMOD.getTime());
    for (const s of staticList) {
      if (!dbSlugSet.has(s.slug)) {
        times.push(STATIC_BLOG_LASTMOD.getTime());
      }
    }
  }
  const latest =
    times.length > 0 ? new Date(Math.max(...times)) : new Date();

  const entries: BlogSitemapRow[] = [
    {
      loc: `${b}/blogs`,
      lastmod: latest,
      priority: 0.75,
    },
  ];

  for (const p of posts) {
    entries.push({
      loc: `${b}/blogs/${encodeURIComponent(p.slug)}`,
      lastmod: p.updatedAt,
      priority: 0.65,
    });
  }

  if (siteDomain === SiteDomain.main) {
    const staticList = await listStaticBlogPosts();
    for (const s of staticList) {
      if (dbSlugSet.has(s.slug)) continue;
      entries.push({
        loc: `${b}/blogs/${encodeURIComponent(s.slug)}`,
        lastmod: STATIC_BLOG_LASTMOD,
        priority: 0.65,
      });
    }
  }

  return entries;
}

/** Published posts + `/blogs` index for `/blogs/sitemap.xml`. */
export async function buildBlogSitemapXml(opts?: {
  baseUrl?: string;
  siteDomain?: SiteDomain;
}): Promise<string> {
  const base = (opts?.baseUrl ?? getSiteUrl()).replace(/\/$/, "");
  const siteDomain = opts?.siteDomain ?? SiteDomain.main;
  const entries = await getPublishedBlogSitemapRows(base, siteDomain);

  const body = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}
