import { NextResponse } from "next/server";
import { resolveOpenAIKey } from "@/lib/api-keys";
import type { ArticleInput, SuggestOptions } from "@/lib/internal-linking/types";
import { suggestInternalLinks } from "@/lib/internal-linking/suggest";

interface SuggestBody {
  articles?: ArticleInput[];
  options?: SuggestOptions;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestBody;
    const articles = body.articles;
    if (!Array.isArray(articles) || articles.length < 2) {
      return NextResponse.json(
        { error: "Provide `articles` (array, min length 2) with id, title, topic, markdown, keywords." },
        { status: 400 },
      );
    }

    for (const a of articles) {
      if (!a.id?.trim() || !a.title?.trim() || !a.topic?.trim() || typeof a.markdown !== "string") {
        return NextResponse.json(
          { error: "Each article needs id, title, topic, markdown (string), and keywords[]" },
          { status: 400 },
        );
      }
      if (!Array.isArray(a.keywords)) {
        return NextResponse.json({ error: "Each article.keywords must be an array" }, { status: 400 });
      }
    }

    const openaiApiKey = resolveOpenAIKey(request);
    const result = await suggestInternalLinks(articles, {
      ...body.options,
      openaiApiKey: openaiApiKey ?? undefined,
    });

    return NextResponse.json({
      ...result,
      hint: openaiApiKey
        ? undefined
        : "No OPENAI_API_KEY: used deterministic hash embeddings (dev/CI). Set OPENAI_API_KEY for semantic vectors.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal link suggestion failed";
    console.error("[api/internal-links/suggest]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
