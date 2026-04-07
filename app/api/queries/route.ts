import { NextResponse } from "next/server";
import { resolveGeminiKey } from "@/lib/api-keys";
import { geminiJSON } from "@/lib/gemini";

interface QueriesBody {
  topic?: string;
  related?: string[];
  paas?: string[];
}

function normalizeQueries(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
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

    const body = (await request.json()) as QueriesBody;
    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const related = body.related ?? [];
    const paas = body.paas ?? [];

    const prompt = `You help cluster SEO search queries. Topic: "${topic}".

Related searches from Google:
${related.join("\n") || "(none)"}

People Also Ask:
${paas.join("\n") || "(none)"}

Return ONLY valid JSON:
{"queries":["8-12 distinct, useful search queries a reader might type"]}

Queries should cover angles: beginner, advanced, comparisons, how-to, troubleshooting, and year/stat angles where relevant.`;

    let queries: string[] = [];
    try {
      const parsed = await geminiJSON<{ queries?: unknown }>(
        prompt,
        geminiKey,
        { temperature: 0.3 },
      );
      queries = normalizeQueries(parsed.queries);
    } catch {
      queries = [];
    }

    if (queries.length === 0) {
      queries = [...related, ...paas].slice(0, 10);
    }

    return NextResponse.json({ queries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Query generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
