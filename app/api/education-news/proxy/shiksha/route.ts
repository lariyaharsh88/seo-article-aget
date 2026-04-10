import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    const response = await fetch("https://www.shiksha.com/NewsIndex1.xml", {
      headers: {
        "User-Agent": randomUA,
        Accept: "application/xml,text/xml,*/*;q=0.9",
        Referer: "https://www.shiksha.com/",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed: ${response.status}` },
        { status: response.status },
      );
    }

    const xmlText = await response.text();

    return new NextResponse(xmlText, {
      headers: {
        "Content-Type": "application/xml",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
