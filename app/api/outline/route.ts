import { NextResponse } from "next/server";
import { resolveGeminiKey } from "@/lib/api-keys";
import { geminiStream } from "@/lib/gemini";
import { capPromptText } from "@/lib/prompt-truncate";
import type { Keyword, PipelineInput } from "@/lib/types";

interface OutlineBody {
  topic?: string;
  audience?: string;
  intent?: PipelineInput["intent"];
  keywords?: Keyword[];
  researchContext?: string;
  serpContext?: string;
  paas?: string[];
  queries?: string[];
}

function stripUnsafeControls(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
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

    let body: OutlineBody;
    try {
      body = (await request.json()) as OutlineBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const audience = body.audience?.trim() || "general readers";
    const intent = body.intent ?? "informational";
    const keywords = body.keywords ?? [];
    const researchContext = stripUnsafeControls(
      capPromptText(
        body.researchContext?.trim() || "No research context.",
        12_000,
      ),
    );
    const serpContext = stripUnsafeControls(
      capPromptText(
        body.serpContext?.trim() || "No SERP context.",
        10_000,
      ),
    );
    const paas = body.paas ?? [];
    const queries = body.queries ?? [];

    const primary =
      keywords.find((k) => k.type === "primary")?.keyword ?? topic;
    const allKw = keywords.map((k) => k.keyword).join(", ");

    const prompt = `Create a detailed article OUTLINE in markdown for an SEO article.

TOPIC: ${topic}
PRIMARY KEYWORD (must appear in H1): ${primary}
ALL KEYWORDS (weave naturally into headings where sensible): ${allKw}
TARGET AUDIENCE: ${audience}
SEARCH INTENT: ${intent}

RESEARCH CONTEXT:
${researchContext}

SERP / COMPETITOR SNAPSHOT:
${serpContext}

CLUSTERED QUERIES:
${queries.slice(0, 24).join("\n") || "(none)"}

PEOPLE ALSO ASK:
${paas.slice(0, 15).join("\n") || "(use generic FAQs if empty)"}

STRICT STRUCTURE:
- One H1 line starting with "# " containing the primary keyword.
- 5-6 H2 sections as "## " — include keywords in several headings.
- Under EACH H2, add 2-3 H3 subheads as "### ".
- Add a "## FAQ" section listing 5 questions taken from the PAA list (or best-fit if fewer than 5).
- Final "## Conclusion" H2 with note to include a clear CTA in the draft.

Output ONLY the markdown outline. No preamble.`;

    /** Use streaming endpoint — matches working /api/article path; avoids rare generateContent failures on long prompts. */
    let outline = "";
    await geminiStream(
      prompt,
      (chunk) => {
        outline += chunk;
      },
      geminiKey,
      { temperature: 0.5, maxOutputTokens: 8192 },
    );

    return NextResponse.json({ outline: outline.trim() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Outline failed";
    console.error("[api/outline]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
