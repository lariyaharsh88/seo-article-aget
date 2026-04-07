import { NextResponse } from "next/server";
import { resolveGeminiKey, resolveSerperKey } from "@/lib/api-keys";
import { geminiJSON } from "@/lib/gemini";
import {
  extractRelatedQueries,
  extractSitelinkTexts,
  serperSearch,
} from "@/lib/serper";
import { fallbackKeywords, normalizeKeywordList } from "@/lib/keyword-guards";
import type { Keyword, PipelineInput } from "@/lib/types";

type KeywordsBody = Pick<PipelineInput, "topic" | "intent" | "audience">;

export async function POST(request: Request) {
  try {
    const geminiKey = resolveGeminiKey(request);
    const serperKey = resolveSerperKey(request);
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key (header or env)." },
        { status: 401 },
      );
    }
    if (!serperKey) {
      return NextResponse.json(
        { error: "Missing Serper API key (header or env)." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as KeywordsBody;
    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const intent = body.intent ?? "informational";
    const audience = body.audience?.trim() ?? "general readers";

    const [r1, r2] = await Promise.all([
      serperSearch(topic, serperKey),
      serperSearch(`${topic} tips guide best`, serperKey),
    ]);

    const relatedSet = new Set<string>([
      ...extractRelatedQueries(r1),
      ...extractRelatedQueries(r2),
    ]);
    const sitelinks = [
      ...extractSitelinkTexts(r1),
      ...extractSitelinkTexts(r2),
    ];

    const serperHints = [
      `Related searches:\n${Array.from(relatedSet).join("\n")}`,
      `Sitelinks titles:\n${sitelinks.join("\n")}`,
    ].join("\n\n");

    const prompt = `You are an SEO keyword strategist. Given the topic, audience, and Serper hints, output exactly 20 keyword objects as JSON.

Topic: ${topic}
Search intent focus: ${intent}
Audience: ${audience}

Serper data:
${serperHints}

Return JSON with this exact shape (no markdown, no commentary):
{"keywords":[{"keyword":"string","type":"primary"|"secondary"|"lsi"|"longtail","intent":"informational"|"commercial"|"transactional","difficulty":"low"|"medium"|"high"}]}

Rules:
- One primary keyword closely matching the topic.
- Balanced mix of secondary, lsi, and longtail.
- Align intent fields sensibly with ${intent}.
- Difficulty is an estimate.`;

    let keywords: Keyword[] = [];
    try {
      const parsed = await geminiJSON<{ keywords?: unknown }>(
        prompt,
        geminiKey,
        { temperature: 0.3 },
      );
      keywords = normalizeKeywordList(parsed.keywords);
    } catch {
      keywords = [];
    }

    if (keywords.length === 0) {
      keywords = fallbackKeywords(topic);
    }

    return NextResponse.json({ keywords });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Keyword research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
