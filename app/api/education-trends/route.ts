import { NextResponse } from "next/server";
import {
  fetchEducationTrends,
  parseEducationFetchScope,
  parseEducationTimeframe,
} from "@/lib/education-trends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("geo") ?? "IN";
    const geo = raw.trim().toUpperCase() || "IN";
    const timeframe = parseEducationTimeframe(searchParams.get("tf"));
    const scope = parseEducationFetchScope(searchParams.get("scope"));
    const data = await fetchEducationTrends(geo, { timeframe, scope });
    return NextResponse.json(data);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load education trends";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
