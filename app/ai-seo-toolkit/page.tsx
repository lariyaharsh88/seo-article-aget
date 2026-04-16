import type { Metadata } from "next";
import { AiSeoToolkitClient } from "@/components/ai-seo-toolkit/AiSeoToolkitClient";
import { JsonLd } from "@/components/JsonLd";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

const AI_TOOLKIT_DESC =
  "AI SEO Toolkit: monitor visibility in AI answers, mine prompts, and optimize for AEO—align long-form content with classic search and generative results.";

const aiToolkitSchema = buildToolWebApplicationSchema({
  path: "/ai-seo-toolkit",
  name: "AI SEO Toolkit — visibility & AEO",
  headline: "AI SEO Toolkit",
  description: AI_TOOLKIT_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "AI SEO Toolkit — Visibility, Prompts & AEO",
  description: AI_TOOLKIT_DESC,
  path: "/ai-seo-toolkit",
  keywords: [
    "AI SEO",
    "AEO",
    "answer engine optimization",
    "AI visibility",
    "prompt mining",
  ],
});

export default async function AiSeoToolkitPage() {
  const markdown = await getToolExplainerMarkdown("ai-seo-toolkit");
  return (
    <>
      <JsonLd data={aiToolkitSchema} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <AiSeoToolkitClient />
      </main>
      <ToolExplainerSection markdown={markdown} />
    </>
  );
}
