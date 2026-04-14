import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { LlmsTxtGeneratorClient } from "@/components/LlmsTxtGeneratorClient";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "Free LLMs.txt generator by RankFlowHQ. Build a clean llms.txt file for AI discoverability and answer engine context.";

export const metadata: Metadata = buildPageMetadata({
  title: "Free LLMs.txt Generator",
  description: DESC,
  path: "/free-tools/llms-txt-generator",
  keywords: ["llms.txt generator", "free llms txt tool", "ai seo tools"],
});

const schema = buildToolWebApplicationSchema({
  path: "/free-tools/llms-txt-generator",
  name: "Free LLMs.txt Generator",
  headline: "Free LLMs.txt Generator",
  description: DESC,
});

export default function LlmsTxtGeneratorPage() {
  return (
    <>
      <JsonLd data={schema} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/" className="text-text-muted hover:text-accent">
            ← Home
          </Link>
        </p>
        <header className="mb-6 mt-3 rounded-2xl border border-border bg-surface/60 p-5">
          <h1 className="font-display text-4xl text-text-primary">Free LLMs.txt Generator</h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">No login required.</p>
        </header>
        <LlmsTxtGeneratorClient />
      </main>
    </>
  );
}

