import { NextResponse } from "next/server";
import { resolveGeminiKey } from "@/lib/api-keys";
import { geminiJSON } from "@/lib/gemini";
import { defaultSeoMeta, isSeoMeta } from "@/lib/seo-meta-guards";
import type { SeoMeta } from "@/lib/types";

interface AuditBody {
  topic?: string;
  article?: string;
  focusKeyword?: string;
}

export async function POST(request: Request) {
  try {
    const geminiKey = resolveGeminiKey(request);
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key (header or env)." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as AuditBody;
    const topic = body.topic?.trim();
    const article = body.article?.trim() ?? "";
    const focusKeyword = body.focusKeyword?.trim() ?? "";

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const prompt = `You are an SEO technical editor. From the article below, output JSON matching this schema exactly:

{
  "metaTitle": "max 60 chars",
  "metaDescription": "max 155 chars",
  "urlSlug": "hyphenated lowercase slug, max 6 words",
  "focusKeyword": "string",
  "secondaryKeywords": ["string"],
  "schemaType": "Article" | "HowTo" | "FAQPage",
  "ogTitle": "string",
  "twitterDescription": "string",
  "readabilityGrade": "string e.g. Grade 8",
  "estimatedWordCount": "string number"
}

Topic context: ${topic}
Focus keyword hint: ${focusKeyword || "(derive)"}

ARTICLE:
${article.slice(0, 12000)}

Rules: metaTitle and metaDescription must satisfy length limits. secondaryKeywords: max 8 items. No markdown, JSON only.`;

    let meta: SeoMeta | null = null;
    try {
      const parsed = await geminiJSON<unknown>(prompt, geminiKey, {
        temperature: 0.3,
      });
      if (isSeoMeta(parsed)) {
        meta = parsed;
      }
    } catch {
      meta = null;
    }

    if (!meta) {
      meta = defaultSeoMeta(topic, article, focusKeyword);
    } else {
      meta = {
        ...meta,
        metaTitle: meta.metaTitle.slice(0, 60),
        metaDescription: meta.metaDescription.slice(0, 155),
        urlSlug: meta.urlSlug
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-|-$/g, "")
          .split("-")
          .filter(Boolean)
          .slice(0, 6)
          .join("-"),
      };
    }

    return NextResponse.json({ meta });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
