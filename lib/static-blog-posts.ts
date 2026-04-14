import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BlogPost } from "@prisma/client";
import type { PublishedBlogListItem } from "@/lib/blog-post-query";

export const ALLOWED_BLOG_SLUGS = [
  "how-to-rank-in-chatgpt-search",
  "best-ai-seo-tools-2026",
  "automate-blog-writing-ai",
  "generative-engine-optimization-guide",
  "ai-keyword-clustering-guide",
] as const;

const STATIC_SPECS = [
  {
    slug: "how-to-rank-in-chatgpt-search",
    title: "How to Rank in ChatGPT Search",
    excerpt:
      "A practical framework to improve visibility in ChatGPT-style discovery using SEO, structure, and answer-ready content design.",
  },
  {
    slug: "best-ai-seo-tools-2026",
    title: "Best AI SEO Tools 2026",
    excerpt:
      "How to evaluate, compare, and deploy AI SEO tools in 2026 without sacrificing content quality or strategic control.",
  },
  {
    slug: "automate-blog-writing-ai",
    title: "Automate Blog Writing AI",
    excerpt:
      "A production-ready playbook for automating blog workflows with AI while maintaining SEO performance and editorial quality.",
  },
  {
    slug: "generative-engine-optimization-guide",
    title: "Generative Engine Optimization Guide",
    excerpt:
      "A complete guide to GEO strategy for ranking in traditional search and AI-generated answer experiences.",
  },
  {
    slug: "ai-keyword-clustering-guide",
    title: "AI Keyword Clustering Guide",
    excerpt:
      "How to cluster keywords by intent, avoid cannibalization, and convert clusters into rankable content architecture.",
  },
] as const;

export function isAllowedBlogSlug(slug: string): boolean {
  return (ALLOWED_BLOG_SLUGS as readonly string[]).includes(slug);
}

async function readMarkdownForSlug(slug: string): Promise<string | null> {
  const filePath = path.join(
    process.cwd(),
    "content",
    "blog-seo-articles",
    `${slug}.md`,
  );
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function getStaticBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const spec = STATIC_SPECS.find((item) => item.slug === slug);
  if (!spec) return null;
  const content = await readMarkdownForSlug(slug);
  if (!content) return null;
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const updatedAt = new Date("2026-01-01T00:00:00.000Z");
  return {
    id: `static-${slug}`,
    slug: spec.slug,
    title: spec.title,
    excerpt: spec.excerpt,
    content,
    published: true,
    authorEmail: "team@rankflowhq.com",
    authorName: "RankFlowHQ Team",
    createdAt,
    updatedAt,
  };
}

export async function listStaticBlogPosts(): Promise<PublishedBlogListItem[]> {
  const results = await Promise.all(
    STATIC_SPECS.map(async (spec) => {
      const content = await readMarkdownForSlug(spec.slug);
      if (!content) return null;
      return {
        id: `static-${spec.slug}`,
        slug: spec.slug,
        title: spec.title,
        excerpt: spec.excerpt,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      } satisfies PublishedBlogListItem;
    }),
  );
  return results.filter(
    (item): item is PublishedBlogListItem => item !== null,
  );
}
