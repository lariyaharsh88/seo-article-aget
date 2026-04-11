"use client";

import { useCallback, useState } from "react";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";

interface ArticleCopyBarProps {
  markdown: string;
  disabled?: boolean;
}

export function ArticleCopyBar({ markdown, disabled }: ArticleCopyBarProps) {
  const [status, setStatus] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2200);
  }, []);

  const copyMarkdown = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      await navigator.clipboard.writeText(markdown);
      flash("Copied full article (Markdown)");
    } catch {
      flash("Copy failed — try HTTPS or allow clipboard");
    }
  }, [markdown, flash]);

  const copyHtml = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const html = markdownToArticleHtml(markdown);
      await navigator.clipboard.writeText(html);
      flash("Copied HTML (tables, headings, lists)");
    } catch {
      flash("Copy failed — try HTTPS or allow clipboard");
    }
  }, [markdown, flash]);

  const empty = !markdown.trim();

  return (
    <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
        Export
      </span>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => void copyMarkdown()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy Markdown
        </button>
        <button
          type="button"
          onClick={() => void copyHtml()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy HTML
        </button>
      </div>
      {status ? (
        <span className="font-mono text-xs text-success" role="status">
          {status}
        </span>
      ) : null}
    </div>
  );
}
