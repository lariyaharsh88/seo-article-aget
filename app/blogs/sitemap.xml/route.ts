import { NextResponse } from "next/server";
import { buildBlogSitemapXml } from "@/lib/blog-sitemap";

/** Regenerated on publish via revalidatePath; CDN may cache briefly (see Cache-Control). */
export const revalidate = 300;

export async function GET() {
  const xml = await buildBlogSitemapXml();
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
