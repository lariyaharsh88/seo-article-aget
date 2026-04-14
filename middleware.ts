import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CANONICAL_HOST = "rankflowhq.com";
const EDUCATION_HOSTS = new Set([
  "education.rankflowhq.com",
  "education.rankflohq.com",
]);

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

  if (!isEducationHost) {
    if (path === "/news" || path.startsWith("/news/")) {
      const url = request.nextUrl.clone();
      url.hostname = "education.rankflowhq.com";
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
    if (
      path === "/education-trends" ||
      path.startsWith("/education/") ||
      path.startsWith("/exam/") ||
      path.startsWith("/nda/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/archive/education";
      return NextResponse.redirect(url, 308);
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
