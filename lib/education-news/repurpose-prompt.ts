import { buildInternalLinkingInstructionBlock } from "@/lib/internal-linking-prompt";
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

BACKGROUND (for you only — do **not** repeat in the article): source publication label: ${opts.source}
ORIGINAL HEADLINE (from URL slug / sitemap): ${opts.title}
ORIGINAL STORY URL (context only — **do not** paste this URL, "see original", "read more at [publisher]", or similar in the body; the site template already links out where needed): ${opts.originalUrl}

SOURCE TEXT (may be partial or noisy — extract facts only; do not copy long phrases verbatim):
${body}

VOICE / ETHICS:
- Do NOT paste copyrighted paragraphs. Paraphrase all wording.
- Write as **RankFlowHQ's own article**: confident, direct editorial voice — as if this site reported the story. Do **not** use syndication-style lines such as "Summary based on reports from…", "According to [news brand]…", "see original for full detail", or any phrasing that hands authority or credit to third-party news brands.
- Do **not** name "${opts.source}" or other commercial news/ed-tech brands in the intro, body, or disclaimers. Prefer neutral sourcing: "Recent updates…", "Official notices…", "The board stated…", "As per the circular…".
- Do **not** tell readers to go read the story elsewhere; the facts should read complete on this page.

LINKS (strict — avoid boosting competitors):
- Add **at most 1–3** outbound markdown links in the whole article, and **only** to **official** sources when you are sure of the URL: government sites (Indian gov.in / nic.in and similar), official board/university/NTA/exam-board domains, or statutory bodies.
- Do **not** link to news aggregators, ed-tech blogs, or commercial test-prep sites. Do **not** markdown-link the original story URL or any competitor homepage in the body.
- If no official URL is certain, **omit the link** and tell readers to verify on the official board or university website.
${buildInternalLinkingInstructionBlock({ mode: "news-repurpose" })}

SEO + STYLE (match RankFlowHQ / seo-agent article rules, but **total length 800–1000 words** — strict):
1. Open with one # H1 — include the main topic phrase naturally (from the headline).
2. Use ## and ### subheads; short paragraphs (2–3 sentences); active voice; Indian English readers (clear Grade 8–10 English, British/Indian spelling where natural).
3. One markdown table OR bullet list for scanability.
4. Small **## FAQ** section: **3–4** questions with tight answers (derived only from facts in the source text).
5. Conclusion with takeaways + one soft CTA (e.g. verify dates on the official site).
6. Optional: one markdown image placeholder line describing a chart (no fake URLs).
7. Keyword use: natural; do not stuff.
8. Follow the INTERNAL LINKS rules above where topics align (same-site hubs).
9. Entire piece **800–1000 words** — count mentally; stay inside this band.

Output **only** valid Markdown (no code fences, no preamble).`;
}
