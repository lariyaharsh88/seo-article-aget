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

/** `/news` index + repurposed article URLs for `/news/sitemap.xml`. */
export async function buildNewsSitemapXml(): Promise<string> {
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

  const entries: { loc: string; lastmod: Date; priority: number }[] = [
    { loc: `${base}/news`, lastmod: latest, priority: 0.72 },
  ];

  for (const a of articles) {
    entries.push({
      loc: `${base}/news/${encodeURIComponent(a.slug)}`,
      lastmod: a.updatedAt,
      priority: 0.64,
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
