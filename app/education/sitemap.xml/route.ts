import { SiteDomain } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPublishedBlogSitemapRows } from "@/lib/blog-sitemap";
import { prisma } from "@/lib/prisma";

type NewsRow = {
  repurposedSlug: string | null;
  updatedAt: Date;
};

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 300;

export async function GET(request: Request) {
  const host = (request.headers.get("host") || "education.rankflowhq.com").split(":")[0];
  const base = `https://${host}`;

  const rows = await prisma.educationNewsArticle.findMany({
    where: {
      repurposeStatus: "ready",
      repurposedSlug: { not: null },
      siteDomain: SiteDomain.education,
    },
    select: {
      repurposedSlug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10000,
  });

  const staticUrls = [
    `${base}/`,
    `${base}/education`,
    `${base}/education-news`,
    `${base}/education-trends`,
    `${base}/news`,
    `${base}/blogs`,
  ];

  const staticXml = staticUrls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
    )
    .join("\n");

  const newsXml = rows
    .filter((r): r is NewsRow & { repurposedSlug: string } => Boolean(r.repurposedSlug?.trim()))
    .map(
      (r) => `  <url>
    <loc>${escapeXml(`${base}/news/${encodeURIComponent(r.repurposedSlug.trim())}`)}</loc>
    <lastmod>${new Date(r.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`,
    )
    .join("\n");

  const sharedRows = await prisma.sharedArticle.findMany({
    where: { siteDomain: SiteDomain.education },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 10000,
  });
  const sharedXml = sharedRows
    .map(
      (r) => `  <url>
    <loc>${escapeXml(`${base}/article/${encodeURIComponent(r.slug)}`)}</loc>
    <lastmod>${new Date(r.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("\n");

  const blogRows = await getPublishedBlogSitemapRows(base, SiteDomain.education);
  const blogXml = blogRows
    .filter((row) => row.loc !== `${base}/blogs`)
    .map(
      (row) => `  <url>
    <loc>${escapeXml(row.loc)}</loc>
    <lastmod>${row.lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${row.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${newsXml}
${sharedXml}
${blogXml}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

