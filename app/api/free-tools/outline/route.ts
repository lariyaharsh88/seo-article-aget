import { NextResponse } from "next/server";
import { buildOutline } from "@/lib/free-tools/outline";
import { hashedIp, hitRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public free tool: outline from Google autocomplete. Rate limited (each call makes ~18 suggest requests). */
export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword")?.trim() ?? "";
  if (keyword.length < 2 || keyword.length > 80) {
    return NextResponse.json({ error: "Enter a keyword of 2–80 characters." }, { status: 400 });
  }
  if (!hitRateLimit(`free-outline:${hashedIp(request)}`, 20)) {
    return NextResponse.json({ error: "You've made a lot of outlines this hour. Please try again later." }, { status: 429 });
  }
  try {
    return NextResponse.json(await buildOutline(keyword), {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Google suggestions right now. Please try again." }, { status: 502 });
  }
}
