import { SiteDomain } from "@prisma/client";
import { NextResponse } from "next/server";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";
import { prisma } from "@/lib/prisma";
import { ALLOWED_BLOG_SLUGS } from "@/lib/static-blog-posts";
import { getSiteUrl } from "@/lib/site-url";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 300;

export async function GET(request: Request) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const siteDomain = EDUCATION_HOSTS.has(host)
    ? SiteDomain.education
    : SiteDomain.main;
  const proto =
    request.headers.get("x-forwarded-proto") === "http" ? "http" : "https";
  const base =
    host && host !== "localhost"
      ? `${proto}://${request.headers.get("host")?.split(":")[0] ?? host}`
      : getSiteUrl().replace(/\/$/, "");

  const rows = await prisma.sharedArticle.findMany({
    where: { siteDomain },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10000,
  });
  const blogRows =
    siteDomain === SiteDomain.main
      ? await prisma.blogPost.findMany({
          where: {
            siteDomain: SiteDomain.main,
            published: true,
            slug: { notIn: [...ALLOWED_BLOG_SLUGS] },
          },
          select: {
            slug: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 10000,
        })
      : [];

  const urls = [...rows, ...blogRows]
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
