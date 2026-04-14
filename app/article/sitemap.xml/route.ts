import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

type SharedArticleSitemapRow = {
  slug: string;
  updatedAt: Date;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 300;

export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const rows = await prisma.$queryRaw<SharedArticleSitemapRow[]>`
    SELECT "slug", "updatedAt"
    FROM "SharedArticle"
    ORDER BY "updatedAt" DESC
    LIMIT 10000
  `;

  const urls = rows
    .map(
      (row) => `  <url>
    <loc>${escapeXml(`${base}/article/${row.slug}`)}</loc>
    <lastmod>${new Date(row.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

