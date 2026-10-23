import { Suspense } from "react";
import { SeoAgentClient } from "@/components/SeoAgentClient";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export default async function SeoAgentPage() {
  const markdown = await getToolExplainerMarkdown("seo-agent");
  return (
    <>
      {/* SeoAgentClient reads search params; without a Suspense boundary the page renders client-only
          and crawlers get no <h1>. The fallback keeps the heading in the server HTML. */}
      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
            <h1 className="font-display text-2xl text-text-primary sm:text-3xl md:text-4xl">
              SEO article generator
            </h1>
          </main>
        }
      >
        <SeoAgentClient />
      </Suspense>
      <ToolExplainerSection markdown={markdown} />
    </>
  );
}
