import { NextResponse } from "next/server";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";
import { syncEducationNewsArticles } from "@/lib/education-news/sync-stored";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const articles = await fetchAllSitemaps();
    const sources = getUniqueSources(articles);

    try {
      await syncEducationNewsArticles(articles);
    } catch (syncErr) {
      console.error("[education-news] sync to DB:", syncErr);
    }

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
