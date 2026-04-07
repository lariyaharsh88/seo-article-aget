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
}

function encodeSseChunk(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify({ text })}\n\n`);
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

  const userPrompt = `Write a COMPLETE, detailed, 2500-word SEO-optimised article.

TOPIC: ${topic}
PRIMARY KEYWORD: ${primary}
ALL KEYWORDS (use naturally): ${allKeywords}
TARGET AUDIENCE: ${audience}
SEARCH INTENT: ${intent}

OUTLINE TO FOLLOW EXACTLY:
${outlineText}

RESEARCH FACTS AND DATA TO INCLUDE:
${researchContext}

USER QUESTIONS TO ANSWER IN FAQ SECTION:
${paas.join("\n") || "(derive from topic)"}

STRICT REQUIREMENTS:
1. Open with # H1 heading — must contain primary keyword
2. Follow every H2 (##) and H3 (###) from the outline above exactly
3. Write 280-350 words per H2 section
4. Cite statistics inline as [Source: domain.com]
5. Keyword density 1.5-2.5% (natural, never stuffed)
6. FAQ section: 5 questions with 2-3 sentence answers each
7. Conclusion: key takeaways + single clear CTA
8. Use bullet points, numbered lists, and **bold text** for scanability
9. Active voice, short paragraphs (3-4 sentences max)
10. Do NOT truncate. Write every section in full.
11. Use markdown formatting throughout

Write the complete article now:`;

  const fullPrompt = `You are a senior SEO content writer with 10+ years experience writing articles that rank on Google page 1. You write in an authoritative, engaging, and clear style. You always back claims with data and cite sources.

${userPrompt}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await geminiStream(
          fullPrompt,
          (chunk) => {
            controller.enqueue(encodeSseChunk(chunk));
          },
          geminiKey,
          { temperature: 0.7, maxOutputTokens: 8192 },
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
