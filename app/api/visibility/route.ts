import { NextResponse } from "next/server";
import {
  estimateVisibilityPosition,
  normalizeDomain,
} from "@/lib/ai-seo/visibility-analyze";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  domain?: string;
  keywords?: string[];
};

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

  const domain = typeof body.domain === "string" ? body.domain.trim() : "";
  const keywords = Array.isArray(body.keywords)
    ? body.keywords
        .filter((k): k is string => typeof k === "string")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  if (!domain || domain.length < 3) {
    return NextResponse.json(
      { error: "domain is required (e.g. example.com)" },
      { status: 400 },
    );
  }
  if (keywords.length === 0) {
    return NextResponse.json(
      { error: "keywords must be a non-empty array of strings" },
      { status: 400 },
    );
  }
  if (keywords.length > 25) {
    return NextResponse.json(
      { error: "Maximum 25 keywords per request" },
      { status: 400 },
    );
  }

  const normDomain = normalizeDomain(domain);
  const results: { keyword: string; mentioned: boolean; position: number | null }[] =
    [];

  try {
    for (const keyword of keywords) {
      const userPrompt = `List the best results for: "${keyword}". Include sources and explanations.`;

      const { content: responseText, model } = await openRouterChat(
        [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        { temperature: 0.4, maxTokens: 2048 },
      );

      const { mentioned, position } = estimateVisibilityPosition(
        responseText,
        normDomain,
      );

      await prisma.visibilityLog.create({
        data: {
          keyword,
          domain: normDomain,
          model,
          mentioned,
          position: position ?? null,
          responseText,
        },
      });

      results.push({ keyword, mentioned, position });
    }

    return NextResponse.json(results);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Visibility check failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
