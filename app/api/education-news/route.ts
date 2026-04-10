import { NextResponse } from "next/server";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const articles = await fetchAllSitemaps();
    const sources = getUniqueSources(articles);

    return NextResponse.json({
      articles,
      sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in education-news API:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", articles: [], sources: [] },
      { status: 500 },
    );
  }
}
