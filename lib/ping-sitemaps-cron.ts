import { EDUCATION_CANONICAL_HOST } from "@/lib/education-hosts";
import { notifyGoogleSitemaps } from "@/lib/google-indexing";
import { getSiteUrl } from "@/lib/site-url";

export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return request.headers.get("x-vercel-cron") === "1";
  const url = new URL(request.url);
  const q = url.searchParams.get("secret")?.trim();
  const header = request.headers.get("x-cron-secret")?.trim();
  return q === secret || header === secret || request.headers.get("x-vercel-cron") === "1";
}

/**
 * Best-effort Google sitemap ping (main + education). Safe to call twice daily
 * from two Vercel Hobby crons (each path may run at most once per day).
 * Does not guarantee GSC “Last read” cadence — Google controls fetch timing.
 */
export async function runPingSitemapsCron(): Promise<{
  pinged: Array<{ origin: string; paths: string[] }>;
}> {
  const mainOrigin = getSiteUrl().replace(/\/$/, "");
  const eduOrigin = `https://${EDUCATION_CANONICAL_HOST}`;

  await notifyGoogleSitemaps({
    siteOrigin: mainOrigin,
    sitemapPaths: ["/sitemap.xml", "/blogs/sitemap.xml", "/article/sitemap.xml"],
  });
  await notifyGoogleSitemaps({
    siteOrigin: eduOrigin,
    sitemapPaths: ["/sitemap.xml", "/news/sitemap.xml", "/blogs/sitemap.xml"],
  });

  return {
    pinged: [
      { origin: mainOrigin, paths: ["/sitemap.xml", "/blogs/sitemap.xml", "/article/sitemap.xml"] },
      {
        origin: eduOrigin,
        paths: ["/sitemap.xml", "/news/sitemap.xml", "/blogs/sitemap.xml"],
      },
    ],
  };
}
