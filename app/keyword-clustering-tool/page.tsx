import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { KeywordClusteringToolClient } from "@/components/KeywordClusteringToolClient";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "Keyword clustering tool by RankFlowHQ: group related keywords, map search intent, and build stronger SEO pages from clean topic clusters.";

export const metadata: Metadata = buildPageMetadata({
  title: "Keyword Clustering Tool — Intent-Based SEO Topic Grouping",
  description: DESC,
  path: "/keyword-clustering-tool",
  keywords: [
    "AI keyword clustering tool",
    "keyword grouping tool",
    "cluster keywords for SEO",
    "free keyword cluster generator",
  ],
});

const appSchema = buildToolWebApplicationSchema({
  path: "/keyword-clustering-tool",
  name: "AI Keyword Clustering Tool",
  headline: "AI Keyword Clustering Tool",
  description: DESC,
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does this keyword clustering tool group terms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It groups terms by lexical and semantic similarity so related keywords are organized into practical intent clusters for one page or topic hub.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export keyword clusters to CSV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. After clustering, use the Download CSV button to export cluster and keyword rows.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to sign up to use this tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The tool is available without login.",
      },
    },
  ],
} as Record<string, unknown>;

export default function KeywordClusteringToolPage() {
  return (
    <>
      <JsonLd data={appSchema} />
      <JsonLd data={faqSchema} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/" className="text-text-muted transition-colors hover:text-accent">
            ← Home
          </Link>
        </p>

        <header className="mb-8 mt-4 space-y-3">
          <h1 className="font-display text-4xl text-text-primary md:text-5xl">
            Keyword Clustering Tool
          </h1>
          <p className="max-w-3xl font-serif text-lg text-text-secondary">
            Group related keywords by intent, reduce cannibalization, and turn clusters into ranking content architecture.
          </p>
        </header>

        <KeywordClusteringToolClient />

        <section className="mt-10 space-y-4 rounded-2xl border border-border bg-background/60 p-5 md:p-6">
          <h2 className="font-display text-3xl text-text-primary">
            What is keyword clustering tool?
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            A keyword clustering tool groups search queries that should be targeted together on one page. Instead of creating separate pages for near-identical phrases, you build one strong page that covers the full intent cluster. This improves topical relevance, reduces duplicate coverage, and gives Google clearer signals about page purpose. For modern SEO teams, clustering is not optional. It is the foundation of scalable architecture because every cluster can become a pillar page, a supporting page, or a structured section inside a larger guide.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Most teams already collect hundreds of keywords from search tools, but the hard part is deciding what belongs together. A keyword clustering tool solves this decision problem. RankFlowHQ helps you organize keywords into usable groups quickly so strategy and execution stay connected. You can copy the clusters, export CSV, and move directly into article production. This closes the gap between keyword research and publishing, which is where many SEO workflows usually break.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Clustering also helps avoid cannibalization. When multiple pages target overlapping keywords, both pages can underperform. With a clear cluster plan, each page has a distinct role in your site map. One page handles the parent query, and related terms become subsections or child pages with internal links. This structure improves crawl clarity, strengthens internal relevance, and makes your content easier for users to navigate.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            RankFlowHQ focuses on practical clustering, not abstract labels. The output is built for real publishing decisions: what page to create, what headings to include, and what supporting terms to cover. This means your team can move from cluster map to publish-ready brief with less manual sorting.
          </p>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl border border-border bg-background/60 p-5 md:p-6">
          <h2 className="font-display text-3xl text-text-primary">How it works</h2>
          <h3 className="font-display text-2xl text-text-primary">1) Input keyword set</h3>
          <p className="font-serif text-sm text-text-secondary">
            Paste your raw keyword list into the tool. Include head terms and long-tail variations from your research source. The larger and cleaner the list, the better your cluster strategy becomes.
          </p>
          <h3 className="font-display text-2xl text-text-primary">2) Cluster by similarity and intent</h3>
          <p className="font-serif text-sm text-text-secondary">
            The tool groups terms that are lexically and contextually related. This produces intent-centered groups that are useful for page planning rather than simple alphabetical buckets.
          </p>
          <h3 className="font-display text-2xl text-text-primary">3) Build page architecture</h3>
          <p className="font-serif text-sm text-text-secondary">
            Treat each cluster as a page candidate. Use the main term as the primary target, then map supporting terms into H2 and H3 sections. Export the cluster output and convert it into a publishing roadmap.
          </p>
          <h3 className="font-display text-2xl text-text-primary">4) Move to article generation</h3>
          <p className="font-serif text-sm text-text-secondary">
            Once clusters are finalized, move into the RankFlowHQ article pipeline to generate complete drafts using the same intent grouping. This keeps strategy and production aligned.
          </p>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl border border-border bg-background/60 p-5 md:p-6">
          <h2 className="font-display text-3xl text-text-primary">Benefits</h2>
          <p className="font-serif text-sm text-text-secondary">
            A keyword clustering tool gives your SEO team faster decisions and cleaner execution. First, it reduces overlap by defining one intent owner per page. Second, it improves page quality because supporting terms are planned before writing, not bolted on afterward. Third, it creates stronger internal-linking logic by organizing content into hubs and child pages.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Clustering also improves editorial efficiency. Writers receive structured briefs with clear topic boundaries, so drafts are more focused and require less restructuring. Editors can review against a clear keyword plan and catch missing coverage quickly. This lowers production friction across the full team.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            For SaaS and agency teams, the biggest gain is repeatability. You can apply the same clustering workflow across every campaign, which makes output quality more consistent over time. RankFlowHQ helps operationalize this model so cluster decisions feed directly into article generation and SEO packaging.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Another major benefit is planning confidence. Without clusters, content roadmaps are often built from isolated keyword rows that do not reflect how users search in reality. With clusters, you see which terms belong together, which terms deserve separate pages, and which clusters should be prioritized first based on business goals. This lets you allocate writing effort where ranking and conversion potential are highest.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Clustering also improves technical SEO outcomes. A coherent page map leads to stronger internal linking paths, fewer orphan pages, and cleaner topical silos. Search engines can understand your domain structure more easily, which supports better crawl efficiency and relevance signals over time. For growing websites, this architecture advantage compounds with every new cluster you publish.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Finally, clustering helps bridge strategy and execution. SEO managers can define intent groups and publishing priorities, while writers and editors execute against clear, structured briefs. This alignment reduces rework, avoids mixed page intent, and improves the consistency of your publishing system. When your team uses one clustering standard across all campaigns, content quality becomes easier to maintain at scale.
          </p>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl border border-border bg-background/60 p-5 md:p-6">
          <h2 className="font-display text-3xl text-text-primary">
            Practical implementation guide
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            Start by collecting your target keyword universe for one topic area. Include commercial, informational, and comparison terms if they are relevant to your funnel. Next, run clustering and review each group manually to confirm intent accuracy. Automated grouping accelerates the process, but human review ensures your final page architecture reflects user expectations and business priorities.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            After review, assign each validated cluster to one page type: primary guide, supporting article, feature page, or comparison page. Then create a short brief for each cluster that includes primary keyword, secondary terms, section goals, and CTA direction. This transforms raw keyword output into a production-ready backlog your team can execute week by week.
          </p>
          <p className="font-serif text-sm text-text-secondary">
            Once pages are drafted and published, monitor performance by cluster rather than by single keyword. This gives a more accurate picture of topical progress and helps you spot pages that need deeper coverage. Update headings, add missing supporting terms, and improve internal links based on results. Treated this way, a keyword clustering tool becomes an ongoing optimization engine, not a one-time planning utility.
          </p>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 md:p-6">
          <h2 className="font-display text-3xl text-text-primary">Use RankFlowHQ CTA</h2>
          <p className="font-serif text-sm text-text-secondary">
            Turn your keyword clusters into complete, optimized articles in one workflow.
          </p>
          <Link
            href="/seo-agent"
            className="inline-block rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
          >
            Try RankFlowHQ
          </Link>
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          <Link
            href="/"
            className="rounded-xl border border-border bg-background/60 p-4 font-serif text-sm text-text-secondary transition-colors hover:border-accent"
          >
            Homepage
          </Link>
          <Link
            href="/blog"
            className="rounded-xl border border-border bg-background/60 p-4 font-serif text-sm text-text-secondary transition-colors hover:border-accent"
          >
            Blog
          </Link>
          <Link
            href="/seo-agent"
            className="rounded-xl border border-border bg-background/60 p-4 font-serif text-sm text-text-secondary transition-colors hover:border-accent"
          >
            Tool page: SEO Article Pipeline
          </Link>
        </section>
      </main>
    </>
  );
}
