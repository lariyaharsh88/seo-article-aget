import { NextResponse } from "next/server";
import { buildGoogleNewsSitemapXml } from "@/lib/education-news/news-sitemap";

export const revalidate = 300;

export async function GET(request: Request) {
  const host = (request.headers.get("host") || "").split(":")[0];
  const proto =
    request.headers.get("x-forwarded-proto") === "http" ? "http" : "https";
  const baseUrl =
    host && host !== "localhost"
      ? `${proto}://${host}`
      : undefined;
  const xml = await buildGoogleNewsSitemapXml(baseUrl ? { baseUrl } : undefined);
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
