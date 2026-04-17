import { buildInternalLinkingInstructionBlock } from "@/lib/internal-linking-prompt";
import { buildContentVariationInstruction } from "@/lib/content-variation";

/**
 * Humanization + anti-AI-slop rules (layered on top of SEO/coverage rules).
 */
export function buildHumanizationLayerBlock(): string {
  return `
HUMANIZATION LAYER (voice + structure — must follow):
- **Sentence rhythm:** Alternate short punchy sentences (5–12 words) with occasional longer explanatory ones (max ~28 words). Never use the same sentence opener in two consecutive paragraphs.
- **Opinion & stance:** Add **2–4** clearly labelled editorial lines across the article using one of: *Editors note:*, *Practical takeaway:*, or *In our view:* — keep each to one sentence and tie it to evidence from research or official sources (no invented experts).
- **Examples:** Include **at least 3** concrete examples (hypothetical user scenarios, named situations, or mini case-style bullets) that fit the audience — not generic filler.
- **Real-world insight:** One short subsection or callout (can be a **blockquote** under an H3) that explains how this topic shows up in day-to-day decisions (work, money, exams, health, etc.) for the reader.
- **Banned AI-tells:** Do **not** lean on these patterns: "In today's fast-paced world", "It's no secret", "Whether you're a beginner or a pro", "delve", "landscape", "robust", "leverage", "game-changer", "unlock", "cutting-edge", "In conclusion" as a section opener, or three rhetorical questions in a row.
- **Transitions:** Do not stack "Furthermore", "Moreover", "Additionally" in adjacent sentences — vary with concrete connectors ("Because…", "After that…", "The result is…").
`;
}

/**
 * EEAT: experience, expertise, authoritativeness, trust — on-page signals.
 */
export function buildEeatSignalsBlock(): string {
  return `
EEAT ON-PAGE SIGNALS (required sections — use markdown):
1. **Author / accountability** — After the intro (before first major H2), add a compact byline block:
   - **By [RankFlowHQ Editorial Team]** (or the site brand used elsewhere)
   - One line: **Published:** [today's date] · **Updated:** [same date] · **Reviewed by:** editorial standards (no fake person names unless you have a real byline in context)
2. **About this guide** — Short H2 or H3 (e.g. "### Why trust this guide") with 2–4 sentences: methodology (what you compared, what sources you prioritise — official/government first).
3. **Sources & further reading** — A dedicated **## Sources** or **## References** section near the end (before or after FAQ) with:
   - **At least 4** bullet points listing authoritative URLs you cited (government, regulator, board, university, official docs) — each bullet: page title + markdown link.
   - **Plus** internal links per INTERNAL LINKS rules (already required separately).
4. **External links:** In the body, link out to **primary** sources where a claim needs verification (not competitor blogs). Keep external links purposeful (1–3 per major section when relevant).
`;
}

/**
 * FAQ JSON-LD, tables, and data-backed copy.
 */
export function buildStructuredDataAndDataSectionsBlock(): string {
  return `
STRUCTURED DATA, TABLES, AND DATA-BACKED COPY:
1. **FAQ schema (JSON-LD):** After the full article body (after Conclusion), output **one** fenced code block with language tag json containing only valid JSON-LD for @type: FAQPage with a mainEntity array matching the on-page FAQ questions you wrote (same wording). Example shape:
   ~~~json
   {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}]}
   ~~~
2. **Tables:** Include **at least 2** markdown tables: one comparing options/criteria relevant to the topic, one for dates/checklists/steps or metrics — with a short caption line above each table (plain text, not a heading).
3. **Data-backed sections:** Include **one** H2 or H3 section titled to imply data (e.g. "What the numbers say" or "Key facts at a glance") with **specific** numbers, ranges, or dates taken from RESEARCH FACTS — each numeric claim tied to an inline citation like [Source: domain] or linked source.
`;
}

/**
 * Full extended instruction bundle for long-form SEO articles.
 */
export function buildArticleGenerationPromptExtensions(): string {
  return `
${buildHumanizationLayerBlock()}
${buildEeatSignalsBlock()}
${buildStructuredDataAndDataSectionsBlock()}
`;
}

/** Composes variation + internal links + extensions used by /api/article. */
export function buildArticlePromptFragments(opts: {
  seed: string;
  outlinePreview: string;
}): {
  variationBlock: string;
  internalLinksBlock: string;
  qualityExtensionsBlock: string;
} {
  return {
    variationBlock: buildContentVariationInstruction(
      `${opts.seed}|${opts.outlinePreview.slice(0, 1000)}`,
      "long-form",
    ),
    internalLinksBlock: buildInternalLinkingInstructionBlock({ mode: "long-form" }),
    qualityExtensionsBlock: buildArticleGenerationPromptExtensions(),
  };
}
