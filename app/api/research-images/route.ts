import { NextResponse } from "next/server";
import { buildResearchChartAssets } from "@/lib/research-chart-from-text";

interface Body {
  topic?: string;
  audience?: string;
  researchContext?: string;
  /** Max chart images to build (1–6). */
  count?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const topic = body.topic?.trim();
    const researchContext = body.researchContext?.trim();
    if (!topic || !researchContext) {
      return NextResponse.json(
        { error: "topic and researchContext are required." },
        { status: 400 },
      );
    }

    const maxImages = Math.min(
      6,
      Math.max(1, Math.floor(Number(body.count)) || 4),
    );

    const images = buildResearchChartAssets(
      researchContext,
      topic,
      maxImages,
    );

    if (images.length === 0) {
      return NextResponse.json(
        {
          error:
            "No chart could be built: research text needs at least two numeric values in the same sentence or line (e.g. percentages or figures to compare).",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ images });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Research images failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
