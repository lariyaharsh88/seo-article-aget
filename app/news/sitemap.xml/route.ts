import { NextResponse } from "next/server";
import { buildGoogleNewsSitemapXml } from "@/lib/education-news/news-sitemap";

export const revalidate = 300;

export async function GET() {
  const xml = await buildGoogleNewsSitemapXml();
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
