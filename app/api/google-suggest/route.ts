import { NextResponse } from "next/server";
import { fetchGoogleSearchSuggestions } from "@/lib/google-suggest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { error: "q must be at least 2 characters", suggestions: [] },
      { status: 400 },
    );
  }

  try {
    const suggestions = await fetchGoogleSearchSuggestions(q);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Suggest failed";
    return NextResponse.json({ error: message, suggestions: [] }, { status: 502 });
  }
}
