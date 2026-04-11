import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Published posts + `/blogs` index for `/blogs/sitemap.xml`. */
export async function buildBlogSitemapXml(): Promise<string> {
  const base = getSiteUrl().replace(/\/$/, "");

  let posts: { slug: string; updatedAt: Date }[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    posts = [];
  }

  const latest =
    posts.length > 0
      ? new Date(
          Math.max(...posts.map((p) => p.updatedAt.getTime())),
        )
      : new Date();

  const entries: { loc: string; lastmod: Date; priority: number }[] = [
    {
      loc: `${base}/blogs`,
      lastmod: latest,
      priority: 0.75,
    },
  ];

  for (const p of posts) {
    entries.push({
      loc: `${base}/blogs/${encodeURIComponent(p.slug)}`,
      lastmod: p.updatedAt,
      priority: 0.65,
    });
  }

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
