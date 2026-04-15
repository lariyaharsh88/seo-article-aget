import { SiteDomain } from "@prisma/client";
import { NextResponse } from "next/server";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";
import { buildBlogSitemapXml } from "@/lib/blog-sitemap";

/** Regenerated on publish via revalidatePath; CDN may cache briefly (see Cache-Control). */
export const revalidate = 300;

export async function GET(request: Request) {
  const host = (request.headers.get("host") || "").split(":")[0];
  const hostLc = host.toLowerCase();
  const siteDomain = EDUCATION_HOSTS.has(hostLc)
    ? SiteDomain.education
    : SiteDomain.main;
  const proto =
    request.headers.get("x-forwarded-proto") === "http" ? "http" : "https";
  const baseUrl =
    host && host !== "localhost"
      ? `${proto}://${host}`
      : undefined;
  const xml = await buildBlogSitemapXml(
    baseUrl ? { baseUrl, siteDomain } : { siteDomain },
  );
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
