import { NextResponse } from "next/server";
import { resolveGeminiKey } from "@/lib/api-keys";
import { geminiJSON } from "@/lib/gemini";
import { pollinationsImageUrl } from "@/lib/pollinations";
import { capPromptText } from "@/lib/prompt-truncate";
import type { ResearchImageAsset } from "@/lib/types";

interface Body {
  topic?: string;
  audience?: string;
  researchContext?: string;
  /** Number of distinct images (3–6). */
  count?: number;
}

interface GeminiImages {
  images: Array<{
    imagePrompt?: string;
    altText?: string;
    insight?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const apiKey = resolveGeminiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key (header or env)." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Body;
    const topic = body.topic?.trim();
    const researchContext = body.researchContext?.trim();
    if (!topic || !researchContext) {
      return NextResponse.json(
        { error: "topic and researchContext are required." },
        { status: 400 },
      );
    }

    const count = Math.min(
      6,
      Math.max(3, Math.floor(Number(body.count)) || 4),
    );
    const audience = body.audience?.trim() || "general readers";

    const prompt = `You are an art director for an editorial blog. Given research notes, propose exactly ${count} DISTINCT image ideas for a free text-to-image service (Pollinations). Each imagePrompt must be self-contained English (max 220 characters), visual and concrete, suitable for a clean editorial or infographic illustration — avoid tiny illegible text inside the image, avoid logos and watermarks. Vary subjects so the set covers different angles of the research.

Topic: ${topic}
Audience: ${audience}

Research (may be truncated):
${capPromptText(researchContext, 14000)}

Return JSON only, no markdown fences:
{"images":[{"imagePrompt":"string","altText":"short alt for accessibility","insight":"one sentence insight for readers under the image"}]}

The array must have exactly ${count} items.`;

    const parsed = await geminiJSON<GeminiImages>(prompt, apiKey, {
      temperature: 0.45,
      maxOutputTokens: 4096,
    });

    const raw = Array.isArray(parsed.images) ? parsed.images : [];
    const images: ResearchImageAsset[] = [];
    for (const row of raw.slice(0, count)) {
      const imagePrompt =
        typeof row.imagePrompt === "string" ? row.imagePrompt.trim() : "";
      const altText =
        typeof row.altText === "string" ? row.altText.trim() : "Illustration";
      const insight =
        typeof row.insight === "string"
          ? row.insight.trim()
          : "Key takeaway from the research.";
      if (!imagePrompt) continue;
      images.push({
        imagePrompt,
        alt: altText.slice(0, 180),
        insight: insight.slice(0, 400),
        url: pollinationsImageUrl(imagePrompt),
      });
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Could not derive image prompts from research." },
        { status: 422 },
      );
    }

    return NextResponse.json({ images });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Research images failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
