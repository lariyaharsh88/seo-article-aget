import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { OffPageSeoClient } from "@/components/off-page-seo/OffPageSeoClient";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export default async function OffPageSeoPage() {
  const explainerMd = await getToolExplainerMarkdown("off-page-seo");
  return (
    <>
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 md:px-6">
        <header className="mb-10 space-y-3 border-b border-border pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Off-page SEO
          </p>
          <h1 className="font-display text-3xl text-text-primary md:text-4xl">
            Backlink prospecting & outreach planner
          </h1>
          <p className="max-w-2xl font-serif text-lg text-text-secondary">
            Discover niche-relevant domains from SERP signals, estimate value, pull public
            contacts, and prioritize who to pitch first — in one workflow.
          </p>
        </header>
        <OffPageSeoClient />
      </main>
      <ToolExplainerSection markdown={explainerMd} />
    </>
  );
}
