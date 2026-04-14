import { NextResponse } from "next/server";
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${newsXml}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

