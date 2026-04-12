import { getSiteUrl } from "@/lib/site-url";

/**
 * Prompt fragment: encourage markdown links to this site’s public pages when topical.
 * Used by the SEO article stream and education-news repurposing.
 */
export function buildInternalLinkingInstructionBlock(opts?: {
  /** Fewer links for short repurposed news (800–1000 words). */
  mode?: "long-form" | "news-repurpose";
}): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const mode = opts?.mode ?? "long-form";
  const count =
    mode === "news-repurpose"
      ? "Add **2–4** markdown internal links"
      : "Add **2–6** markdown internal links";

  return `
INTERNAL LINKS (${base} — same-site SEO):
- ${count} to **this site only**, using **full absolute URLs** in markdown: \`[natural anchor text](${base}/path)\`.
- Place links **in the body** where the topic genuinely relates (e.g. exam or board news → ${base}/news or ${base}/education-trends; content workflow → ${base}/seo-agent; backlinks → ${base}/off-page-seo). **Do not** stuff links in the intro or a single footer paragraph.
- Vary anchor text; do **not** repeat the same phrase for every link.
- If nothing fits naturally, use fewer links — **do not** link unrelated hubs just to meet a number.
- Internal links are **in addition to** any outbound links to official/government sources; they do not replace attribution where facts need an official source.

Hubs you may use when relevant (not exhaustive):
- ${base}/ — tools hub
- ${base}/blogs — blog index
- ${base}/news — education news index
- ${base}/seo-agent — SEO article pipeline
- ${base}/ai-seo-toolkit — AI SEO toolkit
- ${base}/off-page-seo — off-page SEO & outreach
- ${base}/education-trends — Education Google Trends
- ${base}/education-news — education news headline scanner
- ${base}/about — about
`;
}
