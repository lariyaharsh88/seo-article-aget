import { NextResponse } from "next/server";
import { scoreAeoContent } from "@/lib/ai-seo/aeo-score";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { keyword?: string; content?: string };

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

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (keyword.length < 2) {
    return NextResponse.json(
      { error: "keyword is required" },
      { status: 400 },
    );
  }
  if (content.length < 40) {
    return NextResponse.json(
      { error: "content must be at least 40 characters" },
      { status: 400 },
    );
  }
  if (content.length > 120_000) {
    return NextResponse.json(
      { error: "content is too long (max ~120k chars)" },
      { status: 400 },
    );
  }

  try {
    const { content: optimizedContent } = await openRouterChat(
      [
        {
          role: "user",
          content: `Rewrite this content for AI search optimization (ChatGPT, Perplexity, Google AI Overviews):

- Add clear Markdown headings (## and ###)
- Add bullet points where helpful
- Add a "FAQ" section with exactly 5 questions and answers
- Tone: authoritative, factual, scannable
- Optimize for the topic/keyword: "${keyword}"

Return only the rewritten Markdown content (no preamble).

Original content:
${content}`,
        },
      ],
      { temperature: 0.45, maxTokens: 8192 },
    );

    const score = scoreAeoContent(optimizedContent);

    await prisma.optimizedContent.create({
      data: {
        keyword,
        originalContent: content,
        optimizedContent,
        score,
      },
    });

    return NextResponse.json({ optimizedContent, score });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Optimization failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
