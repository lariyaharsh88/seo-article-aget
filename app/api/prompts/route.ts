import { NextResponse } from "next/server";
import {
  dedupeQueries,
  parseAiQuestionLines,
} from "@/lib/ai-seo/prompt-mining";
import { fetchGoogleSearchSuggestions } from "@/lib/google-suggest";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { seed?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const seed = typeof body.seed === "string" ? body.seed.trim() : "";
  if (seed.length < 2) {
    return NextResponse.json(
      { error: "seed must be at least 2 characters" },
      { status: 400 },
    );
  }

  try {
    let googleSuggestions: string[] = [];
    try {
      googleSuggestions = await fetchGoogleSearchSuggestions(seed);
    } catch {
      googleSuggestions = [];
    }

    const { content: aiRaw } = await openRouterChat(
      [
        {
          role: "user",
          content: `Generate 20 high-intent questions users might ask AI assistants (ChatGPT, Perplexity) about: "${seed}".

Output exactly one question per line. No numbering, no bullets, no preamble.`,
        },
      ],
      { temperature: 0.55, maxTokens: 2048 },
    );

    const aiLines = parseAiQuestionLines(aiRaw);
    const merged = dedupeQueries([...googleSuggestions, ...aiLines]);

    for (const q of merged) {
      const fromGoogle = googleSuggestions.some(
        (g) => g.trim().toLowerCase() === q.toLowerCase(),
      );
      const fromAi = aiLines.some(
        (a) => a.trim().toLowerCase() === q.toLowerCase(),
      );
      let source = "combined";
      if (fromGoogle && fromAi) source = "google+ai";
      else if (fromGoogle) source = "google";
      else if (fromAi) source = "ai";

      await prisma.promptQuery.create({
        data: { query: q, source },
      });
    }

    return NextResponse.json({ queries: merged });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Prompt mining failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
