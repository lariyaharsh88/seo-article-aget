import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  const url = raw?.trim();
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only http(s) URLs are allowed" },
        { status: 400 },
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEO-Article-Agent/1.0; +https://github.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page (HTTP ${res.status})` },
        { status: 502 },
      );
    }

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    );

    return NextResponse.json({
      url: res.url,
      title: titleMatch?.[1]?.replace(/\s+/g, " ").trim() ?? "",
      description: descMatch?.[1]?.replace(/\s+/g, " ").trim() ?? "",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch page";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
