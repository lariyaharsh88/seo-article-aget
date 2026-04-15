import { NextResponse } from "next/server";
import { load } from "cheerio";
import {
  resolveGeminiKey,
  resolveGroqKey,
  resolveOpenRouterKey,
  resolveSerperKey,
} from "@/lib/api-keys";
import { geminiJSON, geminiText } from "@/lib/gemini";
import { groqStream } from "@/lib/groq";
import { openRouterChat } from "@/lib/openrouter";
import { extractRelatedQueries, serperSearch } from "@/lib/serper";

type Body = {
  keyword?: string;
};

type CompetitorPage = {
  rank: number;
  url: string;
  title: string;
  snippet: string;
  headings: string[];
  h2: string[];
  h3: string[];
  wordCount: number;
  topTerms: string[];
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "have",
  "will",
  "into",
  "about",
  "what",
  "when",
  "where",
  "which",
  "result",
  "exam",
  "news",
  "update",
]);

function extractTerms(text: string, limit = 12): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

async function fetchCompetitorPage(input: {
  rank: number;
  url: string;
  title: string;
  snippet: string;
}): Promise<CompetitorPage | null> {
  try {
    const res = await fetch(input.url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RankFlowHQ-CompetitorAnalysis/1.0)",
      },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);
    $("script,style,noscript,svg,iframe,nav,footer,header").remove();
    const headings = $("h1,h2,h3")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 30);
    const h2 = $("h2")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 20);
    const h3 = $("h3")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 20);
    const bodyText = $("main,article,body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = bodyText ? bodyText.split(" ").length : 0;
    const topTerms = extractTerms(`${input.title} ${headings.join(" ")}`);
    return {
      rank: input.rank,
      url: input.url,
      title: input.title,
      snippet: input.snippet,
      headings,
      h2,
      h3,
      wordCount,
      topTerms,
    };
  } catch {
    return null;
  }
}

type GapAnalysis = {
  strengths: string[];
  commonSections: string[];
  missingSectionsToAdd: string[];
  recommendedStructure: string[];
  targetWordCount: number;
  semanticKeywords: string[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

async function generateJsonWithFallback<T>(opts: {
  prompt: string;
  geminiKey?: string;
  openRouterKey?: string;
  groqKey?: string;
}): Promise<T> {
  const errors: string[] = [];
  if (opts.geminiKey) {
    try {
      return await geminiJSON<T>(opts.prompt, opts.geminiKey, {
        temperature: 0.25,
        maxOutputTokens: 4096,
      });
    } catch (e) {
      errors.push(`gemini: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (opts.openRouterKey) {
    try {
      const out = await openRouterChat(
        [
          {
            role: "system",
            content:
              "Return only valid JSON. No markdown, no prose before/after JSON.",
          },
          { role: "user", content: opts.prompt },
        ],
        { temperature: 0.2, maxTokens: 4096 },
      );
      return JSON.parse(extractJsonObject(out.content)) as T;
    } catch (e) {
      errors.push(`openrouter: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (opts.groqKey) {
    try {
      const full = await groqStream(
        `${opts.prompt}\n\nReturn only valid JSON.`,
        () => {
          /* no-op */
        },
        opts.groqKey,
        { temperature: 0.2, maxOutputTokens: 4096 },
      );
      return JSON.parse(extractJsonObject(full)) as T;
    } catch (e) {
      errors.push(`groq: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  throw new Error(`All providers failed for JSON generation: ${errors.join(" | ")}`);
}

async function generateTextWithFallback(opts: {
  prompt: string;
  geminiKey?: string;
  openRouterKey?: string;
  groqKey?: string;
}): Promise<string> {
  const errors: string[] = [];
  if (opts.geminiKey) {
    try {
      return await geminiText(opts.prompt, opts.geminiKey, {
        temperature: 0.55,
        maxOutputTokens: 12288,
      });
    } catch (e) {
      errors.push(`gemini: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (opts.openRouterKey) {
    try {
      const out = await openRouterChat(
        [{ role: "user", content: opts.prompt }],
        { temperature: 0.55, maxTokens: 8192 },
      );
      return out.content.trim();
    } catch (e) {
      errors.push(`openrouter: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (opts.groqKey) {
    try {
      return await groqStream(
        opts.prompt,
        () => {
          /* no-op */
        },
        opts.groqKey,
        { temperature: 0.55, maxOutputTokens: 8192 },
      );
    } catch (e) {
      errors.push(`groq: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  throw new Error(`All providers failed for text generation: ${errors.join(" | ")}`);
}

export async function POST(request: Request) {
  const geminiKey = resolveGeminiKey(request);
  const groqKey = resolveGroqKey(request);
  const openRouterKey = resolveOpenRouterKey(request);
  const serperKey = resolveSerperKey(request);
  if (!serperKey || (!geminiKey && !groqKey && !openRouterKey)) {
    return NextResponse.json(
      {
        error:
          "Missing required keys. Provide Serper key and at least one LLM key (Gemini/OpenRouter/Groq).",
      },
      { status: 401 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const keyword = body.keyword?.trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const serp = await serperSearch(keyword, serperKey, "search");
  const organic = (serp.organic ?? [])
    .filter((x) => Boolean(x.link?.trim()))
    .slice(0, 5)
    .map((x, i) => ({
      rank: i + 1,
      url: (x.link || "").trim(),
      title: (x.title || "Untitled result").trim(),
      snippet: (x.snippet || "").trim(),
    }));

  const pages = await Promise.allSettled(
    organic.map((o) => fetchCompetitorPage(o)),
  );
  const competitors = pages
    .filter((r): r is PromiseFulfilledResult<CompetitorPage | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is CompetitorPage => Boolean(v));

  if (competitors.length === 0) {
    return NextResponse.json(
      { error: "Could not extract competitor pages for analysis." },
      { status: 502 },
    );
  }

  const relatedQueries = extractRelatedQueries(serp).slice(0, 12);
  const competitorDump = competitors
    .map(
      (c) => `RANK #${c.rank}
URL: ${c.url}
TITLE: ${c.title}
SNIPPET: ${c.snippet}
H2: ${c.h2.join(" | ")}
H3: ${c.h3.join(" | ")}
WORD COUNT: ${c.wordCount}
TOP TERMS: ${c.topTerms.join(", ")}
---`,
    )
    .join("\n");

  const analysisPrompt = `You are an SEO strategist.
Analyze these top ranking pages for keyword: "${keyword}".

Return STRICT JSON with shape:
{
  "strengths": string[],
  "commonSections": string[],
  "missingSectionsToAdd": string[],
  "recommendedStructure": string[],
  "targetWordCount": number,
  "semanticKeywords": string[]
}

Rules:
- Find what competitors do well.
- Identify gaps and missing sections we should add to outperform.
- Recommend a superior section order.
- targetWordCount between 1800 and 3200.
- semanticKeywords should be practical variants.

Competitor data:
${competitorDump}

Related queries:
${relatedQueries.join(" | ")}`;

  const gap = await generateJsonWithFallback<GapAnalysis>({
    prompt: analysisPrompt,
    geminiKey,
    openRouterKey,
    groqKey,
  });

  const improvedPrompt = `Write a better article than current top-ranking pages for keyword: "${keyword}".

Use this strategy:
- Target word count: ${Math.min(3200, Math.max(1800, gap.targetWordCount || 2200))}
- Recommended structure:
${(gap.recommendedStructure || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}
- Include missing sections:
${(gap.missingSectionsToAdd || []).map((s) => `- ${s}`).join("\n")}
- Cover semantic keywords naturally:
${(gap.semanticKeywords || []).join(", ")}
- Address related queries:
${relatedQueries.join(", ")}

Requirements:
1) Markdown only.
2) Strong H1 + logical H2/H3 flow.
3) More detailed and more updated than competitors.
4) Include "What competitors missed" style value sections naturally.
5) Use factual tone and practical guidance.
6) Add an FAQ section.
7) Add a concise comparison recap section near end.

Do not mention internal analysis.`;

  const improvedArticle = await generateTextWithFallback({
    prompt: improvedPrompt,
    geminiKey,
    openRouterKey,
    groqKey,
  });

  return NextResponse.json({
    keyword,
    relatedQueries,
    competitors,
    comparison: gap,
    improvedArticle,
    generatedAt: new Date().toISOString(),
  });
}
