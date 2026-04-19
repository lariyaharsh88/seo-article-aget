import { NextResponse } from "next/server";
import { EDUCATION_CANONICAL_HOST } from "@/lib/education-hosts";
import { notifyGoogleSitemaps } from "@/lib/google-indexing";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return request.headers.get("x-vercel-cron") === "1";
  const url = new URL(request.url);
  const q = url.searchParams.get("secret")?.trim();
  const header = request.headers.get("x-cron-secret")?.trim();
  return q === secret || header === secret || request.headers.get("x-vercel-cron") === "1";
}

/**
 * Twice-daily best-effort ping so Google’s fetcher may revisit sitemap URLs sooner.
 * Does not guarantee indexing speed or GSC “Last read” timestamps.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mainOrigin = getSiteUrl().replace(/\/$/, "");
  const eduOrigin = `https://${EDUCATION_CANONICAL_HOST}`;

  try {
    await notifyGoogleSitemaps({
      siteOrigin: mainOrigin,
      sitemapPaths: ["/sitemap.xml", "/blogs/sitemap.xml", "/article/sitemap.xml"],
    });
    await notifyGoogleSitemaps({
      siteOrigin: eduOrigin,
      sitemapPaths: ["/sitemap.xml", "/news/sitemap.xml", "/blogs/sitemap.xml"],
    });
  } catch (e) {
    console.error("[cron/ping-sitemaps]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ping failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    pinged: [
      { origin: mainOrigin, paths: ["/sitemap.xml", "/blogs/sitemap.xml", "/article/sitemap.xml"] },
      {
        origin: eduOrigin,
        paths: ["/sitemap.xml", "/news/sitemap.xml", "/blogs/sitemap.xml"],
      },
    ],
    at: new Date().toISOString(),
  });
}
