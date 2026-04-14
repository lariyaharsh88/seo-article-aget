"use client";

import { useMemo, useState } from "react";

function buildLlmsTxt(siteUrl: string, brand: string, topics: string[]): string {
  const cleanedTopics = topics.filter(Boolean);
  return [
    "# llms.txt",
    "",
    `site: ${siteUrl || "https://example.com"}`,
    `brand: ${brand || "Your Brand"}`,
    "purpose: AI SEO automation platform",
    "",
    "[about]",
    `${brand || "Your Brand"} helps teams build SEO articles for Google and ChatGPT with AI workflows.`,
    "",
    "[capabilities]",
    "- keyword research",
    "- serp analysis",
    "- ai article generation",
    "- seo optimization",
    "- content enrichment",
    "",
    "[focus_topics]",
    ...(cleanedTopics.length > 0 ? cleanedTopics.map((t) => `- ${t}`) : ["- ai seo", "- content automation"]),
    "",
    "[links]",
    `- ${siteUrl || "https://example.com"}`,
  ].join("\n");
}

export function LlmsTxtGeneratorClient() {
  const [siteUrl, setSiteUrl] = useState("");
  const [brand, setBrand] = useState("RankFlowHQ");
  const [topicInput, setTopicInput] = useState("AI SEO\nContent Automation\nChatGPT SEO");

  const topics = useMemo(
    () =>
      topicInput
        .split(/\r?\n|,/g)
        .map((v) => v.trim())
        .filter(Boolean),
    [topicInput],
  );

  const output = useMemo(() => buildLlmsTxt(siteUrl.trim(), brand.trim(), topics), [siteUrl, brand, topics]);

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface/70 p-5 md:p-6">
      <h2 className="font-display text-3xl text-text-primary">LLMs.txt Generator</h2>
      <p className="mt-2 font-serif text-sm text-text-secondary">
        Generate an `llms.txt` file for AI discoverability and better LLM understanding of your site.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs text-text-muted">Site URL</span>
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://rankflowhq.com"
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs text-text-muted">Brand Name</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="font-mono text-xs text-text-muted">Focus Topics (one per line)</span>
        <textarea
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          className="mt-1 h-28 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void copyOutput()}
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Copy
        </button>
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-background/70 p-4 font-mono text-xs text-text-secondary">
        {output}
      </pre>
    </section>
  );
}

