"use client";

import { ArticleRenderer } from "@/components/ArticleRenderer";

interface ToolExplainerSectionProps {
  markdown: string;
  /** Visible heading for the guide block. */
  title?: string;
}

export function ToolExplainerSection({
  markdown,
  title = "Guide",
}: ToolExplainerSectionProps) {
  if (!markdown.trim()) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-6">
      <section
        className="border-t border-border pt-12"
        aria-labelledby="tool-explainer-heading"
      >
        <h2
          id="tool-explainer-heading"
          className="font-display text-2xl text-text-primary md:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-2xl font-serif text-sm text-text-muted">
          What this tool is for, how to use it, and important limitations.
        </p>
        <div className="mt-8 text-text-secondary">
          <ArticleRenderer markdown={markdown} />
        </div>
      </section>
    </div>
  );
}
