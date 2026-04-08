import { NextResponse } from "next/server";
import { resolveSerperKey } from "@/lib/api-keys";
import {
  extractFeaturedSnippet,
  extractRelatedQueries,
  serperSearch,
} from "@/lib/serper";

interface SerpBody {
  topic?: string;
}

export async function POST(request: Request) {
  try {
    const serperKey = resolveSerperKey(request);
    if (!serperKey) {
      return NextResponse.json(
        { error: "Missing Serper API key (header or env)." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as SerpBody;
    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const data = await serperSearch(topic, serperKey);
    const organicItems = (data.organic ?? []).slice(0, 8);

    let organic = organicItems
      .map((o, i) => {
        const title = o.title ?? "Result";
        const link = o.link ?? "";
        const snippet = o.snippet ?? "";
        return `${i + 1}. ${title}\n   ${link}\n   ${snippet}`;
      })
      .join("\n\n");

    const featuredSnippet = extractFeaturedSnippet(data);
    if (featuredSnippet) {
      const head = featuredSnippet.title
        ? `Title: ${featuredSnippet.title}\n`
        : "";
      const foot = featuredSnippet.url
        ? `\nSource: ${featuredSnippet.url}`
        : "";
      organic += `\n\n---\nFEATURED SNIPPET (Google answer box)\n${head}${featuredSnippet.text}${foot}`;
    }

    const paas = (data.peopleAlsoAsk ?? [])
      .map((p) => p.question)
      .filter((q): q is string => typeof q === "string" && q.length > 0);

    const related = extractRelatedQueries(data);

    return NextResponse.json({ organic, paas, related, featuredSnippet });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SERP fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
