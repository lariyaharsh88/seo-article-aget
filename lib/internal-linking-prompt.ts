import { getSiteUrl } from "@/lib/site-url";

/**
 * Prompt fragment: encourage markdown links to this site’s public pages when topical.
 * Used by the SEO article stream and education-news repurposing.
 */
export function buildInternalLinkingInstructionBlock(opts?: {
  /** Mode-specific relevance hints for long-form vs repurposed news. */
  mode?: "long-form" | "news-repurpose";
}): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const mode = opts?.mode ?? "long-form";
  const count = "Add **5–8** markdown internal links";
  const relevanceHint =
    mode === "news-repurpose"
      ? "For exam/news stories, prioritize contextual links to similar exams, previous-year updates, admit cards, syllabus, and related news explainers."
      : "Prioritize contextually related pages and avoid broad/generic links.";

  return `
INTERNAL LINKS (${base} — same-site SEO):
- ${count} to **this site only**, using **full absolute URLs** in markdown: \`[natural anchor text](${base}/path)\`.
- Use keyword-rich anchor text (e.g. "UPSC admit card 2026", "SSC CGL previous year result trend"), never generic anchors like "click here", "read more", or "here".
- Place links **in the body** where the topic genuinely relates (e.g. exam or board news → ${base}/news or ${base}/education-trends; content workflow → ${base}/seo-agent; backlinks → ${base}/off-page-seo). Spread links naturally across sections.
- ${relevanceHint}
- Internal links must stay in the same tab: use standard markdown links only; do not add target="_blank" for internal URLs.
- Internal links are **in addition to** any outbound links to official/government sources; they do not replace attribution where facts need an official source.
- End the article with a dedicated section titled exactly: **## 📚 Related Articles**.
- In that section, add 5–8 bullet links to the most relevant internal pages for the current topic.

Hubs you may use when relevant (not exhaustive):
- ${base}/ — tools hub
- ${base}/blogs — blog index
- ${base}/news — education news index
- ${base}/seo-agent — SEO article pipeline
- ${base}/repurpose-url — repurpose any article URL through the full pipeline
- ${base}/ai-seo-toolkit — AI SEO toolkit
- ${base}/off-page-seo — off-page SEO & outreach
- ${base}/education-trends — Education Google Trends
- ${base}/education-news — education news headline scanner
- ${base}/about — about
`;
}
