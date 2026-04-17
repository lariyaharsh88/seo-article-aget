import { buildInternalLinkingInstructionBlock } from "@/lib/internal-linking-prompt";
import { buildContentVariationInstruction } from "@/lib/content-variation";
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
  const variationBlock = buildContentVariationInstruction(
    `${opts.title}|${opts.source}|${opts.originalUrl}`,
    "news",
  );

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
- The final article must read as **100% unique, human-written newsroom copy** (not templated AI output).
- Preserve factual accuracy, but rewrite all phrasing completely in original language.
- Avoid robotic transitions and repetitive section openers.

LINKS (strict — avoid boosting competitors):
- Add **at most 1–3** outbound markdown links in the whole article, and **only** to **official** sources when you are sure of the URL: government sites (Indian gov.in / nic.in and similar), official board/university/NTA/exam-board domains, or statutory bodies.
- Do **not** link to news aggregators, ed-tech blogs, or commercial test-prep sites. Do **not** markdown-link the original story URL or any competitor homepage in the body.
- If no official URL is certain, **omit the link** and tell readers to verify on the official board or university website.
${buildInternalLinkingInstructionBlock({ mode: "news-repurpose" })}
${variationBlock}

SOURCE CREDIBILITY (strict):
- Prioritise **primary source facts** (official notification, circular, board/university notice, government PDF).
- Include this exact phrase once in the early body (adjust date only):
  **"According to the official notification released on [date]..."**
- Quote exact values from source text wherever available: dates, times, cut-offs, eligibility numbers, fee amounts, exam windows, document names.
- Do not invent figures. If a value is unclear, write "not specified in the official notification" instead of guessing.
- Add section: **## Official Notification Snapshot**
  - 3–6 bullet points of exact source-derived facts.
- Add section: **## PDF / Circular Summary**
  - 3–5 bullets summarising what the official PDF/notice says (or "Official PDF summary pending verification" if PDF text is unavailable).

SEO + NEWS OPTIMISATION (strict; **total length 900–1200 words**):
1. Open with exactly one # H1 using this style:
   [Exam/Board Name] 2026 OUT (LIVE) – Direct Link, PDF Download, Check Details
   - Adapt naturally if the item is admit card / answer key / counselling / timetable / merit list.
   - Keep it factual and credible (no fake claims).
2. Immediately below H1, write one short metadata line in markdown:
   **Meta Description:** <150–165 characters including urgency words like LIVE/Today/Released and keywords such as result, admit card, exam date, direct link, PDF download where relevant>
3. Add section: ## Title Options (High CTR)
   - Provide exactly 3 alternative SEO titles as bullet points before the main story sections.
   - Titles must be factual, emotionally compelling, and non-clickbait.
   - At least one title should include year + action keyword (Released/Out/Direct Link/PDF).
4. Add section: ## 🔥 Latest Update (Today)
   - 2–3 short lines only, real-time tone, fact-based.
5. Add section: ## 🔗 Direct Important Links
   - Bullet list with exactly these labels:
     - Official Website:
     - Download PDF:
     - Result / Check Link:
   - Use official URLs only when certain; otherwise write "To be updated on official website".
6. Add section: ## 📊 Key Highlights
   - One markdown table with rows for:
     - Exam Name
     - Conducting Body
     - Date
     - Status
     - Official Website
7. Add section: ## What changed and why now
   - 2 short paragraphs with real-world context (policy change, exam cycle timing, administrative trigger, or student demand).
8. Add section: ## RankFlowHQ Analysis (Unique Insight)
   - 3–5 bullet points with original newsroom analysis (not copied facts), such as trend comparison, likely next steps, student risk points, and preparation strategy.
   - Avoid generic filler. Each bullet must add a practical takeaway.
9. Add section: ## Visual Breakdown
   - Add at least 2 visual placeholders in markdown image syntax with descriptive alt text and source note context.
   - Example topics: timeline chart, eligibility flow, application steps.
10. Add section: ## Quick Action Checklist
   - 6–10 bullet points students/parents can follow immediately.
11. Add section: ## Important Dates and Deadlines
   - Add a second markdown table with date, event, who is affected, and required action.
12. Use clear SEO structure with keyword placement:
   - main keyword in H1, first 100 words, and at least 2 H2 headings.
   - include the main keyword in at least 1 H3 heading too (for FAQ or detail sub-sections).
   - do not use generic H2/H3 labels like "Important Details" without the keyword context.
13. Internal links:
   - Add at least 5 internal markdown links to relevant pages on this site.
   - Use descriptive anchor text (not "click here").
   - Distribute links naturally across body sections and FAQ, not as one dumped list.
14. Human newsroom style:
   - Add context on why the update happened and why now.
   - Explain clear student impact (who should act, what changes for them, and by when).
   - Use natural sentence variety (mix short and longer sentences); avoid repetitive rhythm.
   - Avoid generic AI filler like "in today's fast-paced world", "it is important to note", "delve into", "landscape", "moreover" chains.
15. Readability:
   - Short paragraphs (2–3 sentences max), bullet points, and bold key facts like date/time/status.
16. Add section: **## Why this matters**
   - 2 short paragraphs on real-world impact for students/parents.
17. Add **## Frequently Asked Questions** with 4–7 FAQs:
   - Use ### question headings and 2–4 sentence answers.
   - Keep answers factual and directly useful, anchored to official notification details.
18. Add section: ## FAQ Schema (JSON-LD)
   - Add one valid FAQPage JSON-LD block matching the on-page FAQ questions and answers.
   - Keep names and acceptedAnswer text aligned with the visible FAQ content.
19. Add section: ## About the Author and Editorial Process
   - 2 short paragraphs about RankFlowHQ Editorial Team expertise in education updates, fact-check flow, and verification standards.
   - Mention that official notifications are prioritised over secondary reports.
20. Finish with a concise conclusion + verification reminder on official website.
21. Follow INTERNAL LINKS rules above where relevant.
22. Google Discover optimisation:
   - Keep a large featured image placeholder near top for 1200px+ hero image usage.
   - Use an emotional but factual headline/hook (no clickbait, no misleading claims).
   - Keep opening mobile-first: short lines, short paragraphs, immediate value.
   - Include byline/date block near top:
     **By RankFlowHQ Editorial Team**
     **Published: [today], Updated: [today]**

Output only valid Markdown. Include exactly one JSON-LD FAQ schema block and no preamble.`;
}
