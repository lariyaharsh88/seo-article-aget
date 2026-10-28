import { NextResponse } from "next/server";
import { auditPage } from "@/lib/free-tools/on-page";
import { hashedIp, hitRateLimit } from "@/lib/rate-limit";
import { UnsafeUrlError } from "@/lib/safe-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Public free tool: on-page SEO audit of one URL. SSRF-guarded fetch, rate limited per IP. */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!url || url.length > 2000) {
    return NextResponse.json({ error: "Enter a page URL." }, { status: 400 });
  }
  if (!hitRateLimit(`free-onpage:${hashedIp(request)}`, 15)) {
    return NextResponse.json({ error: "You've checked a lot of pages this hour. Please try again later." }, { status: 429 });
  }
  try {
    return NextResponse.json(await auditPage(url));
  } catch (e) {
    const msg =
      e instanceof UnsafeUrlError
        ? e.message
        : e instanceof Error && /timeout|abort/i.test(e.message)
          ? "The page took too long to respond."
          : e instanceof Error && e.message.startsWith("That URL")
            ? e.message
            : "We couldn't open that page. Check the URL and try again.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
