/** Single list of free SEO tools — used by /free-tools, the sitemap and "related tools" links. */
export type FreeTool = {
  slug: string;
  title: string;
  blurb: string;
  /** Newer tools use the shared FreeToolShell page. */
  category: "Research" | "Writing" | "On-page" | "Technical";
};

export const FREE_TOOLS: FreeTool[] = [
  { slug: "meta-tag-generator", title: "Meta Title & Description Generator", blurb: "Get SEO titles and meta descriptions that fit Google's limits.", category: "On-page" },
  { slug: "serp-preview", title: "SERP Preview Tool", blurb: "See how your page will look in Google on desktop and mobile.", category: "On-page" },
  { slug: "on-page-seo-checker", title: "On-Page SEO Checker", blurb: "Enter a URL and get a checklist of on-page SEO issues.", category: "Technical" },
  { slug: "content-outline-generator", title: "Content Outline Generator", blurb: "Turn a keyword into an article outline from real Google searches.", category: "Writing" },
  { slug: "headline-generator", title: "Headline Generator", blurb: "Dozens of click-worthy blog titles for any keyword.", category: "Writing" },
  { slug: "readability-checker", title: "Readability & Keyword Density Checker", blurb: "Score readability and check how often your keyword appears.", category: "Writing" },
  { slug: "faq-schema-generator", title: "FAQ Schema Generator", blurb: "Create FAQPage JSON-LD for rich results — copy and paste.", category: "Technical" },
  { slug: "word-counter", title: "Word Counter & Reading Time", blurb: "Count words, characters and reading time as you type.", category: "Writing" },
  { slug: "keyword-clustering", title: "Keyword Clustering", blurb: "Group similar keywords by topic and intent in seconds.", category: "Research" },
  { slug: "keyword-extractor", title: "Keyword Extractor", blurb: "Extract the most important terms from any text.", category: "Research" },
  { slug: "ai-search-grader", title: "AI Search Grader", blurb: "Check how ready your page is to be cited by AI search.", category: "Technical" },
  { slug: "llms-txt-generator", title: "LLMs.txt Generator", blurb: "Generate an llms.txt file for your website.", category: "Technical" },
];

export function getFreeTool(slug: string): FreeTool {
  const t = FREE_TOOLS.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown free tool: ${slug}`);
  return t;
}
