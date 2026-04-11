import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CANONICAL_HOST = "rankflowhq.com";

/**
 * Send www / production *.vercel.app traffic to the apex domain (canonical URLs for SEO).
 * Preview deployments (VERCEL_ENV=preview) keep their *.vercel.app host so QA still works.
 */
export async function middleware(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const host = rawHost.split(":")[0]?.toLowerCase() ?? "";

  if (host === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
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
