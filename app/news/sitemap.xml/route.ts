import { NextResponse } from "next/server";
import { buildNewsSitemapXml } from "@/lib/education-news/news-sitemap";

export const revalidate = 300;

export async function GET() {
  const xml = await buildNewsSitemapXml();
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
