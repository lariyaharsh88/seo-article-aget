import { resolveGeminiKey } from "@/lib/api-keys";
import { geminiStream } from "@/lib/gemini";
import { capPromptText } from "@/lib/prompt-truncate";
import type { Keyword, PipelineInput } from "@/lib/types";

interface ArticleBody {
  topic?: string;
  audience?: string;
  intent?: PipelineInput["intent"];
  keywords?: Keyword[];
  researchContext?: string;
  outlineText?: string;
  paas?: string[];
  /** Real queries from Search Console (when user fetched them). */
  searchConsoleQueries?: string[];
  /** Google autocomplete suggestions for the primary phrase. */
  googleSuggestions?: string[];
}

function encodeSseChunk(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify({ text })}\n\n`);
}

/** Dedupe case-insensitively; keeps first casing. */
function dedupeQueryLines(queries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const t = q.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function numberedLines(queries: string[]): string {
  return queries.map((q, i) => `${i + 1}. ${q}`).join("\n");
}

export async function POST(request: Request) {
  const geminiKey = resolveGeminiKey(request);
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: "Missing Gemini API key (header or env)." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: ArticleBody;
  try {
    body = (await request.json()) as ArticleBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const topic = body.topic?.trim();
  if (!topic) {
    return new Response(JSON.stringify({ error: "topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const audience = body.audience?.trim() || "general readers";
  const intent = body.intent ?? "informational";
  const keywords = body.keywords ?? [];
  const primary =
    keywords.find((k) => k.type === "primary")?.keyword ?? topic;
  const allKeywords = keywords.map((k) => k.keyword).join(", ");
  const researchContext = capPromptText(
    body.researchContext?.trim() || "",
    14_000,
  );
  const outlineText = capPromptText(body.outlineText?.trim() || "", 12_000);
  const paas = body.paas ?? [];
  const gscQueries = dedupeQueryLines(
    Array.isArray(body.searchConsoleQueries)
      ? body.searchConsoleQueries.filter(
          (q): q is string => typeof q === "string" && q.trim().length > 0,
        )
      : [],
  );
  const autoSuggest = dedupeQueryLines(
    Array.isArray(body.googleSuggestions)
      ? body.googleSuggestions.filter(
          (q): q is string => typeof q === "string" && q.trim().length > 0,
        )
      : [],
  );

  const gscBlock =
    gscQueries.length > 0
      ? capPromptText(numberedLines(gscQueries), 16_000)
      : "";
  const suggestBlock =
    autoSuggest.length > 0
      ? capPromptText(numberedLines(autoSuggest), 16_000)
      : "";

  const searchItemCount = gscQueries.length + autoSuggest.length;
  const wordTarget =
    searchItemCount > 20
      ? "2000–4000+"
      : searchItemCount > 8
        ? "2000–3200"
        : "2000–2500";

  const coverageBlock =
    searchItemCount === 0
      ? ""
      : `
MANDATORY — COVER **EVERY** SEARCH LINE BELOW (NONE MAY BE SKIPPED):
- **Search Console list:** every numbered line must appear in the article: either woven into the outline sections (heading, paragraph, or bullet that clearly matches that query) **OR** as its own FAQ entry.
- **Autocomplete list:** same rule — every numbered line must appear in the body **OR** as FAQ.
- If a query does not fit naturally inside an outline section, add it under **## Search-related questions** (or expand **## Frequently asked questions**) using **###** with the query text as the heading (fix only tiny grammar if needed), then 2–4 sentence answer matching that exact intent.
- **Do not merge** two different queries into one FAQ unless they are identical text. Do not skip queries to save length.
- Total FAQ items = at least (PAA questions below) **plus** every GSC/autocomplete line you did not fully answer in the body (use one FAQ pair per remaining query).

`;

  const userPrompt = `Write a COMPLETE, detailed, ${wordTarget}-word SEO-optimised article (extend length when needed so coverage rules are met — do not cut off early).

TOPIC: ${topic}
PRIMARY KEYWORD: ${primary}
ALL KEYWORDS (use naturally): ${allKeywords}
TARGET AUDIENCE: ${audience}
SEARCH INTENT: ${intent}

OUTLINE TO FOLLOW EXACTLY:
${outlineText}

RESEARCH FACTS AND DATA TO INCLUDE:
${researchContext}

PEOPLE-ALSO-ASK / SERP QUESTIONS (use in FAQ; minimum 5 if this list has enough lines):
${paas.join("\n") || "(derive from topic)"}

GOOGLE SEARCH CONSOLE QUERIES — numbered; must ALL be addressed in article body OR as FAQ (see rules):
${gscQueries.length > 0 ? gscBlock : "(none — skip GSC coverage rules)"}

GOOGLE AUTOCOMPLETE SUGGESTIONS — numbered; must ALL be addressed in article body OR as FAQ (see rules):
${autoSuggest.length > 0 ? suggestBlock : "(none — skip autocomplete coverage rules)"}
${coverageBlock}
STRICT REQUIREMENTS:
1. Open with # H1 heading — must contain primary keyword
2. Follow every H2 (##) and H3 (###) from the outline above exactly
3. Write substantial paragraphs per H2 section; if search lists are long, add the **## Search-related questions** section before the conclusion as needed
4. Cite statistics inline as [Source: domain.com]
5. Keyword density 1.5-2.5% for primary (natural, never stuffed)
6. **FAQ:** At least **5** questions from PAA when available; **plus** one FAQ pair (question + answer) for **each** Search Console query and autocomplete line not already clearly answered in the body sections above
7. Conclusion: key takeaways + single clear CTA
8. Use at least one markdown table and multiple bullet/numbered lists for scanability
9. Add 1-2 data-visual placeholders in markdown image format with clear alt text and source note (for example charts/infographics based on cited stats)
10. Keep introduction short and relevant (about 90-130 words)
11. Active voice, short paragraphs (2-3 sentences max), simple sentence structure
12. Keep each paragraph concise and meaningful; do not add fluff, but **do** add extra FAQ/subsections when needed to satisfy every numbered search line
13. LANGUAGE FOR INDIAN READERS (English): Write so everyday Indian readers can follow easily — many read English as a second language.
    - Use **short sentences** (often 10–18 words). One main idea per sentence.
    - Choose **common everyday words** over fancy or rare synonyms (say “use” not “utilise”, “buy” not “procure”, “end” not “terminate”).
    - **Explain** any necessary technical word the first time in simple English, in parentheses or a short phrase.
    - **Avoid** heavy idioms, slang, riddles, and culture-specific US/UK jokes or references.
    - Prefer **British/Indian English spelling** where natural (e.g. colour, organisation, behaviour) — stay consistent.
    - Do not sound textbook-dry: stay friendly and direct, but never patronising.
14. Do NOT truncate. Write every section in full — including every required FAQ/search query answer.
15. Use markdown formatting throughout

Write the complete article now:`;

  const fullPrompt = `You are a senior SEO content writer with 10+ years experience writing articles that rank on Google page 1. You write in an authoritative, engaging, and clear style. You always back claims with data and cite sources.

Your default reader is a **typical Indian English reader**: comfortable with English for work or study, but not reading literary or legal English all day. Use **simple, clear English** (about Grade 8–10 readability): plain words, short sentences, minimal jargon, and no assumptions about Western pop-culture or US-centric framing unless the topic requires it.

${userPrompt}`;

  const encoder = new TextEncoder();
  const maxOutputTokens =
    searchItemCount > 0 ? 16_384 : 8_192;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await geminiStream(
          fullPrompt,
          (chunk) => {
            controller.enqueue(encodeSseChunk(chunk));
          },
          geminiKey,
          { temperature: 0.7, maxOutputTokens },
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Article stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
