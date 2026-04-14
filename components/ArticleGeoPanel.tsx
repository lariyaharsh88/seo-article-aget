"use client";

import { useMemo } from "react";

type Props = {
  article: string;
  topic: string;
  primaryKeyword?: string;
};

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceChunks(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function computeGeoScore(article: string, keyword: string): number {
  const t = article.toLowerCase();
  const k = keyword.trim().toLowerCase();
  const hasH2 = /^##\s+/m.test(article);
  const hasH3 = /^###\s+/m.test(article);
  const hasFaq = /faq|frequently asked questions/i.test(article);
  const hasBullets = /^\s*[-*]\s+/m.test(article);
  const hasTable = /\|.+\|/.test(article);
  const hasData = /\b\d+(\.\d+)?%?\b/.test(article);
  const keywordMentions = k ? (t.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))?.length ?? 0) : 0;

  let score = 35;
  if (hasH2) score += 12;
  if (hasH3) score += 8;
  if (hasFaq) score += 10;
  if (hasBullets) score += 8;
  if (hasTable) score += 7;
  if (hasData) score += 7;
  if (keywordMentions >= 3) score += 8;
  return Math.min(100, Math.max(0, score));
}

function buildSnippet(article: string, topic: string): string {
  const plain = stripMarkdown(article);
  const sentences = sentenceChunks(plain);
  const intro = sentences.slice(0, 2).join(" ");
  const fallback = `Learn ${topic} with clear steps, practical examples, and SEO-ready guidance.`;
  return (intro || fallback).slice(0, 280);
}

function buildAnswerSimulation(article: string, topic: string): string {
  const plain = stripMarkdown(article);
  const sentences = sentenceChunks(plain);
  const pick = sentences.slice(0, 4).join(" ");
  const body = pick || `The article explains ${topic} with actionable steps and examples.`;
  return `Here is a concise answer based on this page:\n\n${body}\n\nKey takeaway: follow a structured workflow, validate with evidence, and keep sections clear so both users and AI systems can interpret the content reliably.`;
}

export function ArticleGeoPanel({ article, topic, primaryKeyword }: Props) {
  const baseKeyword = primaryKeyword?.trim() || topic.trim();
  const score = useMemo(() => computeGeoScore(article, baseKeyword), [article, baseKeyword]);
  const snippet = useMemo(() => buildSnippet(article, topic), [article, topic]);
  const answer = useMemo(() => buildAnswerSimulation(article, topic), [article, topic]);

  if (!article.trim()) {
    return (
      <p className="font-serif text-text-secondary">
        Generate an article first to preview GEO outputs (AI Answer Score, snippet preview, and ChatGPT answer simulation).
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-border bg-background/60 p-4">
        <h3 className="font-display text-2xl text-text-primary">AI Answer Score</h3>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          Heuristic score for answer-engine readiness based on structure, clarity markers, and coverage signals.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-lg bg-accent px-3 py-1 font-mono text-sm text-background">
            {score}/100
          </span>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-border bg-background/60 p-4">
        <h3 className="font-display text-2xl text-text-primary">LLM Snippet Preview</h3>
        <p className="mt-2 rounded-lg border border-border/70 bg-background/80 p-3 font-serif text-sm text-text-secondary">
          {snippet}
        </p>
      </article>

      <article className="rounded-xl border border-border bg-background/60 p-4">
        <h3 className="font-display text-2xl text-text-primary">ChatGPT Answer Simulation</h3>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border/70 bg-background/80 p-3 font-serif text-sm text-text-secondary">
          {answer}
        </pre>
      </article>
    </section>
  );
}
