import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";

const CANONICAL_HOST = "rankflowhq.com";

/**
 * Host canonicalization for `www` is handled in **Vercel → Project → Domains** (redirect
 * `www` → apex or the reverse). Doing the same redirect here caused ERR_TOO_MANY_REDIRECTS
 * when the edge also redirected between www and apex.
 *
 * Production `*.vercel.app` → apex below keeps custom-domain SEO clean; preview deployments
 * (VERCEL_ENV=preview) keep their deployment URL.
 */
export async function middleware(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const host = rawHost.split(":")[0]?.toLowerCase() ?? "";
  const path = request.nextUrl.pathname;
  const isEducationHost = EDUCATION_HOSTS.has(host);

  if (isEducationHost && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/education";
    return NextResponse.rewrite(url);
  }

  if (isEducationHost && path === "/sitemap.xml") {
    const url = request.nextUrl.clone();
    url.pathname = "/education/sitemap.xml";
    return NextResponse.rewrite(url);
  }

  if (isEducationHost && path === "/robots.txt") {
    const url = request.nextUrl.clone();
    url.pathname = "/education/robots.txt";
    return NextResponse.rewrite(url);
  }

  /**
   * SaaS marketing, tools, and programmatic pages live on apex only.
   * Prevents duplicate indexing of the same HTML on education.rankflowhq.com.
   */
  if (isEducationHost) {
    const mainOnlyPaths = new Set([
      "/seo-agent",
      "/ai-seo-tools",
      "/automate-blog-writing-ai",
      "/generative-engine-optimization",
      "/ai-content-automation",
      "/keyword-clustering-tool",
      "/repurpose-url",
      "/ai-seo-toolkit",
      "/off-page-seo",
      "/pricing",
      "/about",
      "/pages",
      "/privacy",
      "/terms",
    ]);
    if (
      mainOnlyPaths.has(path) ||
      path.startsWith("/free-tools/") ||
      path.startsWith("/blog/ai-seo/")
    ) {
      const url = request.nextUrl.clone();
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  if (isEducationHost && (path === "/archive/news" || path.startsWith("/archive/news/"))) {
    const url = request.nextUrl.clone();
    url.pathname = path.replace(/^\/archive\/news/, "/news");
    return NextResponse.redirect(url, 308);
  }

  if (isEducationHost && (path === "/archive/education" || path.startsWith("/archive/education/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/education";
    return NextResponse.redirect(url, 308);
  }

  if (
    isEducationHost &&
    (path === "/blogs" ||
      path.startsWith("/blogs/") ||
      path === "/blog" ||
      path.startsWith("/blog/") ||
      path === "/article" ||
      path.startsWith("/article/") ||
      path === "/share" ||
      path.startsWith("/share/"))
  ) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (!isEducationHost) {
    /** Canonical blog URLs: `/blog` is primary; `/blogs` mirrors the same content. */
    if (path === "/blogs" || path.startsWith("/blogs/")) {
      const url = request.nextUrl.clone();
      url.pathname = path.replace(/^\/blogs/, "/blog");
      return NextResponse.redirect(url, 308);
    }

    if (
      path === "/news" ||
      path.startsWith("/news/") ||
      path === "/education" ||
      path.startsWith("/education/") ||
      path === "/education-news" ||
      path.startsWith("/education-news/") ||
      path === "/education-trends" ||
      path.startsWith("/education-trends/") ||
      path.startsWith("/exam/") ||
      path.startsWith("/results/") ||
      path.startsWith("/nda/") ||
      path.startsWith("/api/education-news") ||
      path.startsWith("/api/education-trends")
    ) {
      const url = request.nextUrl.clone();
      url.hostname = "education.rankflowhq.com";
      url.protocol = "https:";
      return NextResponse.redirect(url, 301);
    }
    if (
      path === "/archive/news" ||
      path.startsWith("/archive/news/") ||
      path === "/archive/education" ||
      path.startsWith("/archive/education/")
    ) {
      return new NextResponse("Gone", { status: 410 });
    }
  }

  if (
    process.env.VERCEL_ENV === "production" &&
    host.endsWith(".vercel.app")
  ) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (request.nextUrl.pathname.startsWith("/blog-create")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const url = new URL("/auth/signin", request.url);
      url.searchParams.set("callbackUrl", "/blog-create");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
