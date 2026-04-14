import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET(request: Request) {
  const host = (request.headers.get("host") || "education.rankflowhq.com").split(":")[0];
  const base = `https://${host}`;
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

