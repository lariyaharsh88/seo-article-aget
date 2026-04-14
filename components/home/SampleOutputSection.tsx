"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type SampleCard = {
  id: "keyword" | "outline" | "article";
  title: string;
  subtitle: string;
  content: string;
};

const SAMPLE_CARDS: SampleCard[] = [
  {
    id: "keyword",
    title: "Example keyword",
    subtitle: "Primary + intent-aligned support terms",
    content: `Primary: how to rank in chatgpt search

Secondary:
- chatgpt seo strategy
- optimize content for ai search
- geo vs seo
- llm search ranking factors
- answer engine optimization checklist`,
  },
  {
    id: "outline",
    title: "Generated outline",
    subtitle: "SERP + research guided heading structure",
    content: `# How to Rank in ChatGPT Search

## Why ChatGPT search visibility matters in 2026
## How ChatGPT-style retrieval works
### Retrieval signals vs generation signals
### Why structure improves answer inclusion
## Step-by-step GEO workflow
### Keyword clustering and intent mapping
### Evidence-backed section writing
### Internal linking for topical authority
## Common mistakes to avoid
## FAQ`,
  },
  {
    id: "article",
    title: "Final article preview",
    subtitle: "Long-form draft with citations + SEO packaging",
    content: `ChatGPT search visibility is increasingly driven by clarity, trust, and structure — not keyword repetition. Pages that answer one intent family deeply, use clean heading hierarchy, and include concrete examples are easier for answer engines to retrieve and summarize.

A practical workflow starts with long-tail clustering, then moves to SERP-aware outlining, evidence-backed drafting, and post-draft SEO audit. When teams run this process consistently, they improve both traditional ranking performance and AI-answer inclusion probability.

[Preview truncated]
- Full article: 2,000+ words
- Includes FAQs and internal links
- Includes SEO title/description package`,
  },
];

export function SampleOutputSection() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    keyword: true,
    outline: true,
    article: true,
  });

  function toggle(id: SampleCard["id"]) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-12 rounded-2xl border border-border bg-surface/60 p-5 md:p-6"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Sample output
      </p>
      <h2 className="mt-2 font-display text-3xl text-text-primary md:text-4xl">
        See what you get before you run the tool
      </h2>
      <p className="mt-2 max-w-3xl font-serif text-sm text-text-secondary">
        From keyword to outline to final draft, here is a realistic example of
        output generated in the RankFlowHQ pipeline.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {SAMPLE_CARDS.map((card, idx) => (
          <motion.article
            key={card.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: idx * 0.06, duration: 0.35, ease: "easeOut" }}
            whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(2, 132, 199, 0.15)" }}
            className="flex min-h-[320px] flex-col rounded-xl border border-border bg-background/70 p-4"
          >
            <motion.button
              type="button"
              onClick={() => toggle(card.id)}
              className="flex w-full items-start justify-between gap-3 text-left"
              aria-expanded={open[card.id]}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h3 className="font-display text-2xl text-text-primary">
                  {card.title}
                </h3>
                <p className="mt-1 font-serif text-xs text-text-muted">
                  {card.subtitle}
                </p>
              </div>
              <motion.span
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-xs text-accent"
              >
                {open[card.id] ? "Collapse" : "Expand"}
              </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {open[card.id] ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="mt-4 overflow-hidden"
                >
                  <pre className="h-full whitespace-pre-wrap rounded-lg border border-border/70 bg-background/80 p-3 font-mono text-xs leading-relaxed text-text-secondary">
                    {card.content}
                  </pre>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="mt-4 overflow-hidden"
                >
                  <pre className="line-clamp-3 whitespace-pre-wrap rounded-lg border border-border/70 bg-background/80 p-3 font-mono text-xs leading-relaxed text-text-secondary">
                    {card.content}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
