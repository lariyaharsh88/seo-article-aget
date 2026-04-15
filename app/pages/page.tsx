import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import {
  PagesDirectoryClient,
  type DirectoryGroup,
} from "@/components/PagesDirectoryClient";
import { buildCollectionPageSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "All Pages",
  description:
    "Browse all RankFlowHQ page types: tools, free tools, blogs, landing pages, and public article pages.",
  path: "/pages",
});

const groups: DirectoryGroup[] = [
  {
    heading: "Core Tools",
    description: "Main workflow tools for content creation and optimisation.",
    items: [
      {
        href: "/seo-agent",
        label: "SEO Article Pipeline",
        blurb: "Generate full SEO-ready long-form articles.",
      },
      {
        href: "/ai-seo-toolkit",
        label: "AI SEO Toolkit",
        blurb: "Run keyword, SERP, and content optimisation tasks.",
      },
      {
        href: "/repurpose-url",
        label: "Repurpose URL",
        blurb: "Turn existing pages into improved publish-ready drafts.",
      },
      {
        href: "/off-page-seo",
        label: "Off-page SEO",
        blurb: "Discover outreach opportunities and link signals.",
      },
      {
        href: "/keyword-clustering-tool",
        label: "Keyword Clustering Tool",
        blurb: "Group search terms into actionable topic clusters.",
      },
    ],
  },
  {
    heading: "Free Tools",
    description: "Lightweight utilities for quick SEO and AI checks.",
    items: [
      {
        href: "/free-tools/keyword-clustering",
        label: "Free Keyword Clustering",
        blurb: "Quickly cluster terms without the full pipeline.",
      },
      {
        href: "/free-tools/llms-txt-generator",
        label: "LLMs.txt Generator",
        blurb: "Create LLM-facing site guidance files.",
      },
      {
        href: "/free-tools/ai-search-grader",
        label: "AI Search Grader",
        blurb: "Score your AI search visibility and quality.",
      },
      {
        href: "/free-tools/keyword-extractor",
        label: "Keyword Extractor",
        blurb: "Extract topic terms from any text input.",
      },
    ],
  },
  {
    heading: "Blog & Content",
    description: "Editorial surfaces and generated article destinations.",
    items: [
      {
        href: "/blog",
        label: "Blog Index",
        blurb: "Browse published editorial content.",
      },
      {
        href: "/blogs",
        label: "Legacy Blog Index",
        blurb: "Access older blog archive routes.",
      },
      {
        href: "/blog/ai-seo/ai-seo-tools-guide",
        label: "Programmatic SEO Example",
        blurb: "See a live programmatic page structure example.",
      },
      {
        href: "/seo-agent",
        label: "Public Articles",
        blurb: "Generate publishable pages under /article/[slug].",
      },
    ],
  },
  {
    heading: "SEO Landing Pages",
    description: "Marketing and topical SEO entry pages.",
    items: [
      {
        href: "/ai-seo-tools",
        label: "AI SEO Tools",
        blurb: "Primary landing page for AI SEO intent.",
      },
      {
        href: "/automate-blog-writing-ai",
        label: "Automate Blog Writing AI",
        blurb: "Landing page for blog automation queries.",
      },
      {
        href: "/generative-engine-optimization",
        label: "Generative Engine Optimization",
        blurb: "Entry page focused on GEO concepts and services.",
      },
      {
        href: "/ai-content-automation",
        label: "AI Content Automation",
        blurb: "Landing page for content workflow automation.",
      },
    ],
  },
];

export default function PagesDirectory() {
  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/pages",
          headline: "All Pages",
          description: "Directory of all major RankFlowHQ page types and tools.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "All Pages", path: "/pages" },
          ],
        })}
      />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-text-primary md:text-5xl">
          All Pages
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-sm text-text-secondary">
          Discover every major route in one place. Use quick search and category
          filters to jump to the right page faster.
        </p>
        <PagesDirectoryClient groups={groups} />
      </main>
    </>
  );
}

