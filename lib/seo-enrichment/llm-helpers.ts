import { geminiText } from "@/lib/gemini";

export async function geminiImagePrompt(
  sectionTitle: string,
  body: string,
  keyword: string,
  apiKey: string,
): Promise<string> {
  const prompt = `Write ONE English image prompt (max 900 characters) for a professional editorial illustration.
Topic keyword: ${keyword}
Section heading: ${sectionTitle}
Section excerpt (for context only):
${body.slice(0, 1400)}

Rules: no text, letters, or watermarks in the image; modern flat vector or clean photo style; suitable for a tech/SEO blog hero under a heading.
Output ONLY the prompt text, no quotes.`;

  const out = (
    await geminiText(prompt, apiKey, { temperature: 0.65, maxOutputTokens: 512 })
  ).trim();
  return out.replace(/^["']|["']$/g, "").slice(0, 4000);
}

export async function geminiComparisonTableHtml(
  body: string,
  title: string,
  apiKey: string,
): Promise<string> {
  const prompt = `Create ONE valid HTML fragment: a single <table> with <thead> and <tbody>.
Use ONLY information explicitly stated in the section text below. Do not invent statistics, brands, or prices.

Section title: ${title}

Section text:
${body.slice(0, 10_000)}

Output ONLY the <table>...</table> HTML. No markdown, no code fences, no explanation.`;

  let html = (
    await geminiText(prompt, apiKey, { temperature: 0.15, maxOutputTokens: 8192 })
  ).trim();
  if (html.startsWith("```")) {
    html = html.replace(/^```html?\n?/i, "").replace(/```\s*$/i, "").trim();
  }
  if (!/<table[\s>]/i.test(html)) {
    throw new Error("Model did not return a table");
  }
  return html;
}
