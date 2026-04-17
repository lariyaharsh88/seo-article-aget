export type BacklinkIdea = {
  channel: string;
  tactic: string;
  effort: "low" | "medium" | "high";
  anchorHint: string;
  urlPattern: string;
  notes: string;
};

/**
 * Programmatic SEO / off-page distribution ideas (manual or semi-automated).
 * Not automated spam — ops checklist for legitimate placements.
 */
export function buildBacklinkIdeasForArticle(input: {
  title: string;
  canonicalUrl: string;
  primaryKeyword?: string;
}): BacklinkIdea[] {
  const kw = input.primaryKeyword?.trim() || input.title;
  return [
    {
      channel: "Medium (syndicate)",
      tactic: "Republish a 30% excerpt with canonical link to your site + CTA to full guide.",
      effort: "medium",
      anchorHint: `learn more about ${kw}`,
      urlPattern: "https://medium.com/new-story",
      notes: "Set canonical via Medium import settings or link prominently in first paragraph.",
    },
    {
      channel: "LinkedIn article",
      tactic: "Native article with 2–3 key sections + “Read full framework” → your URL.",
      effort: "medium",
      anchorHint: input.title.slice(0, 60),
      urlPattern: "https://www.linkedin.com/article/new/",
      notes: "Strong for B2B; avoid duplicate full text — summarize.",
    },
    {
      channel: "Reddit / niche sub",
      tactic: "Answer a question with 5–7 bullets + link as ‘full write-up’ (follow sub rules).",
      effort: "low",
      anchorHint: "detailed guide",
      urlPattern: "(community-specific)",
      notes: "Disclose affiliation; no drive-by drops.",
    },
    {
      channel: "Indie Hackers / similar",
      tactic: "Build-in-public post: problem → what you shipped → link to doc.",
      effort: "medium",
      anchorHint: "how we documented it",
      urlPattern: "https://www.indiehackers.com/post/new",
      notes: "Story-first; link is secondary.",
    },
    {
      channel: "GitHub README / Wiki",
      tactic: "If tool-related: add “Docs” section linking to your pillar page.",
      effort: "low",
      anchorHint: "documentation",
      urlPattern: "(your repo)",
      notes: "Only when genuinely relevant to repo users.",
    },
    {
      channel: "Web 2.0 properties",
      tactic: "Tumblr / WordPress.com free blog: one summary post pointing to canonical.",
      effort: "high",
      anchorHint: kw.slice(0, 40),
      urlPattern: "https://www.tumblr.com/new/text",
      notes: "Low trust alone — use as supporting entity, not primary strategy.",
    },
    {
      channel: "HARO / journalist queries",
      tactic: "Pitch 2–3 sentences + offer your guide as reference.",
      effort: "medium",
      anchorHint: "source: your brand",
      urlPattern: "(platform-specific)",
      notes: "High quality when placed; unpredictable.",
    },
    {
      channel: "Resource / link roundup outreach",
      tactic: "Find “resources” posts in niche; suggest your URL as addition.",
      effort: "high",
      anchorHint: input.title.slice(0, 50),
      urlPattern: "(target blog contact)",
      notes: "Personalize; show why it fits their list.",
    },
  ];
}
