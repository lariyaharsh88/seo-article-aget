import { NextResponse } from "next/server";
import { resolveTavilyKey } from "@/lib/api-keys";
import { tavilySearch } from "@/lib/tavily";
import type { Source } from "@/lib/types";

interface ResearchBody {
  topic?: string;
}

function toSource(url: string, title: string, snippet: string): Source {
  return { url, title, snippet };
}

export async function POST(request: Request) {
  try {
    const tavilyKey = resolveTavilyKey(request);
    if (!tavilyKey) {
      return NextResponse.json(
        { error: "Missing Tavily API key (header or env)." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ResearchBody;
    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const [deep, stats] = await Promise.all([
      tavilySearch(topic, tavilyKey, "advanced"),
      tavilySearch(
        `${topic} statistics data 2024 2025`,
        tavilyKey,
        "advanced",
      ),
    ]);

    const map = new Map<string, Source>();
    for (const r of [...deep.results, ...stats.results]) {
      if (!r.url) continue;
      if (!map.has(r.url)) {
        map.set(
          r.url,
          toSource(r.url, r.title ?? r.url, (r.content ?? "").slice(0, 600)),
        );
      }
    }

    const results = Array.from(map.values()).slice(0, 16);
    const context = results
      .map(
        (s) =>
          `TITLE: ${s.title}\nURL: ${s.url}\nSNIPPET: ${s.snippet}\n---`,
      )
      .join("\n");

    const answer = [deep.answer, stats.answer].filter(Boolean).join("\n\n");

    return NextResponse.json({ results, answer, context });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
