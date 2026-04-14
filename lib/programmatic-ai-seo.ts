export type ProgrammaticKeywordPage = {
  keyword: string;
  slug: string;
};

function slugifyKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const HEAD_TERMS = [
  "ai seo tools",
  "chatgpt seo",
  "seo content automation",
  "ai keyword clustering",
  "generative engine optimization",
] as const;

const MODIFIERS = [
  "for saas",
  "for startups",
  "for agencies",
  "for ecommerce",
  "for b2b",
  "workflow",
  "strategy",
  "guide",
  "best practices",
  "checklist",
  "template",
  "examples",
  "2026",
  "step by step",
  "for beginners",
  "advanced",
  "tools",
  "software",
  "automation",
  "playbook",
  "framework",
  "optimization",
] as const;

function buildKeywordCatalog(): ProgrammaticKeywordPage[] {
  const seen = new Set<string>();
  const pages: ProgrammaticKeywordPage[] = [];

  for (const term of HEAD_TERMS) {
    for (const modifier of MODIFIERS) {
      const keyword = `${term} ${modifier}`;
      const slug = slugifyKeyword(keyword);
      if (seen.has(slug)) continue;
      seen.add(slug);
      pages.push({ keyword, slug });
    }
  }

  return pages;
}

export const PROGRAMMATIC_AI_SEO_KEYWORDS = buildKeywordCatalog();

export function getProgrammaticKeywordBySlug(
  slug: string,
): ProgrammaticKeywordPage | undefined {
  const normalized = slugifyKeyword(slug);
  return PROGRAMMATIC_AI_SEO_KEYWORDS.find((item) => item.slug === normalized);
}

export function getProgrammaticKeywordPages(): ProgrammaticKeywordPage[] {
  return PROGRAMMATIC_AI_SEO_KEYWORDS;
}

