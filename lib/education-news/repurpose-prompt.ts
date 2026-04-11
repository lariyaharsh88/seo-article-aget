import { capPromptText } from "@/lib/prompt-truncate";

/**
 * Same SEO writing principles as /api/article (RankFlow / seo-agent), compressed for repurposing.
 * Target **800–1000 words** only (not full pipeline length).
 */
export function buildEducationNewsRepurposePrompt(opts: {
  title: string;
  source: string;
  originalUrl: string;
  plainTextFromPage: string | null;
}): string {
  const body = opts.plainTextFromPage
    ? capPromptText(opts.plainTextFromPage, 10_000)
    : "(No page text could be fetched — write only from the headline and source below.)";

  return `You are a senior SEO editor repurposing a **same-day education news** item into a **new, original** article for RankFlowHQ readers.

SOURCE PUBLICATION: ${opts.source}
ORIGINAL HEADLINE (from URL slug / sitemap): ${opts.title}
ORIGINAL STORY URL (must be credited once, not keyword-stuffed): ${opts.originalUrl}

SOURCE TEXT (may be partial or noisy — extract facts only; do not copy long phrases verbatim):
${body}

LEGAL / ETHICS:
- Do NOT paste copyrighted paragraphs. Paraphrase; attribute facts to "${opts.source}" or "reports" where appropriate.
- Add a short editor's note near the top: "Summary based on reports from ${opts.source}; see original for full detail."

SEO + STYLE (match RankFlowHQ / seo-agent article rules, but **total length 800–1000 words** — strict):
1. Open with one # H1 — include the main topic phrase naturally (from the headline).
2. Use ## and ### subheads; short paragraphs (2–3 sentences); active voice; Indian English readers (clear Grade 8–10 English, British/Indian spelling where natural).
3. One markdown table OR bullet list for scanability.
4. Small **## FAQ** section: **3–4** questions with tight answers (derived only from facts in the source text).
5. Conclusion with takeaways + one soft CTA (e.g. verify dates on the official site).
6. Optional: one markdown image placeholder line describing a chart (no fake URLs).
7. Keyword use: natural; do not stuff.
8. Entire piece **800–1000 words** — count mentally; stay inside this band.

Output **only** valid Markdown (no code fences, no preamble).`;
}
