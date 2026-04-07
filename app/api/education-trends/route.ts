import { NextResponse } from "next/server";
import { fetchEducationTrends } from "@/lib/education-trends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("geo") ?? "US";
    const geo = raw.trim().toUpperCase() || "US";
    const data = await fetchEducationTrends(geo);
    return NextResponse.json(data);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load education trends";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
