import { NextResponse } from "next/server";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";
import { runAutoRepurposeAfterSync } from "@/lib/education-news/auto-repurpose-after-sync";
import { syncEducationNewsArticles } from "@/lib/education-news/sync-stored";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 300;

export async function GET() {
  try {
    const articles = await fetchAllSitemaps();
    const sources = getUniqueSources(articles);

    try {
      const { newPendingIds } = await syncEducationNewsArticles(articles);
      await runAutoRepurposeAfterSync(newPendingIds);
    } catch (syncErr) {
      console.error("[education-news] sync / auto-repurpose:", syncErr);
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
