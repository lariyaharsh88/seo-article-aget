import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getProgrammaticKeywordBySlug, getProgrammaticKeywordPages } from "@/lib/programmatic-ai-seo";
import { buildPageMetadata } from "@/lib/seo-page";
import { getSiteUrl } from "@/lib/site-url";

type Props = {
  params: { keyword: string };
};

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return getProgrammaticKeywordPages().map((item) => ({ keyword: item.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = getProgrammaticKeywordBySlug(params.keyword);
  if (!page) {
    return {
      ...buildPageMetadata({
        title: "AI SEO keyword page",
        description: "AI SEO keyword page not found.",
        path: `/blog/ai-seo/${params.keyword}`,
      }),
      robots: { index: false, follow: true },
    };
  }

  return {
    ...buildPageMetadata({
      title: `${page.keyword} | AI SEO Guide`,
      description: `Learn ${page.keyword} with actionable SEO workflows, tool integration, and a direct path to generate ranked articles in RankFlowHQ.`,
      path: `/blog/ai-seo/${page.slug}`,
      keywords: [page.keyword, "AI SEO", "SEO automation", "ChatGPT SEO"],
    }),
    robots: { index: false, follow: true },
  };
}

export default function ProgrammaticKeywordPage({ params }: Props) {
  const page = getProgrammaticKeywordBySlug(params.keyword);
  if (!page) notFound();

  const canonicalUrl = `${getSiteUrl().replace(/\/$/, "")}/blog/ai-seo/${page.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${page.keyword} guide`,
    description: `Programmatic guide for ${page.keyword}.`,
    url: canonicalUrl,
    author: {
      "@type": "Organization",
      name: "RankFlowHQ",
    },
    publisher: {
      "@type": "Organization",
      name: "RankFlowHQ",
    },
  } as Record<string, unknown>;

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/blog" className="text-text-muted transition-colors hover:text-accent">
            ← Blog
          </Link>
        </p>

        <article className="mt-4 rounded-2xl border border-border bg-surface/60 p-6 md:p-8">
          <h1 className="font-display text-4xl text-text-primary md:text-5xl">
            {page.keyword}
          </h1>

          <section className="mt-6">
            <h2 className="font-display text-2xl text-text-primary">Intro</h2>
            <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">
              {page.keyword} is a high-intent AI SEO topic for teams that want more
              qualified organic traffic and faster content execution. This page is part
              of RankFlowHQ&apos;s programmatic SEO structure, designed to give clear,
              actionable guidance per keyword while preserving search intent fit.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-2xl text-text-primary">Explanation</h2>
            <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">
              To rank for <strong>{page.keyword}</strong>, focus on one intent cluster,
              map primary and supporting questions, and publish content with clean
              hierarchy (H1/H2/H3), direct answer blocks, and internal links. High
              performing pages in this niche combine relevance, specificity, and
              conversion context. That means your article should not only explain the
              topic, but also show implementation steps and practical outcomes.
            </p>
            <p className="mt-3 font-serif text-sm leading-relaxed text-text-secondary">
              Use this framework: define the target audience, gather SERP context,
              create a structured outline, generate a long-form draft, then run SEO
              refinement before publishing. This keeps quality consistent as you scale
              from a few pages to 100+ keyword pages.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-2xl text-text-primary">Tool integration</h2>
            <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">
              Execute this keyword directly in the RankFlowHQ toolchain:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 font-serif text-sm text-text-secondary">
              <li>
                Use <Link href="/seo-agent" className="text-accent hover:underline">SEO Agent</Link> to
                generate a complete article draft.
              </li>
              <li>
                Use{" "}
                <Link href="/free-tools/keyword-clustering" className="text-accent hover:underline">
                  Free Keyword Clustering
                </Link>{" "}
                to group related subtopics.
              </li>
              <li>
                Explore additional workflows in{" "}
                <Link href="/ai-seo-tools" className="text-accent hover:underline">
                  AI SEO Tools
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="mt-8 rounded-xl border border-accent/30 bg-accent/10 p-5">
            <h2 className="font-display text-2xl text-text-primary">CTA</h2>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              Turn this keyword into a ranked article with SERP context and AI
              enrichment in one pipeline.
            </p>
            <Link
              href="/seo-agent"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              Generate SEO Article
            </Link>
          </section>
        </article>
      </main>
    </>
  );
}

