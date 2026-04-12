"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewsArticle } from "@/lib/education-news/types";

interface ArticlePreviewModalProps {
  article: NewsArticle;
  onClose: () => void;
}

export function EducationNewsArticlePreviewModal({
  article,
  onClose,
}: ArticlePreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "reader">("preview");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/education-news/preview?url=${encodeURIComponent(article.url)}`,
        );
        const data = (await response.json()) as {
          success?: boolean;
          htmlContent?: string;
          error?: string;
        };

        if (data.success && data.htmlContent !== undefined) {
          setContent(data.htmlContent);
        } else {
          setError(data.error ?? "Could not load preview");
        }
      } catch {
        setError("Failed to load article");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchArticle();
  }, [article]);

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onEscape]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="education-news-preview-title"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <div className="min-w-0 flex-1 pr-4">
            <h3
              id="education-news-preview-title"
              className="line-clamp-2 font-display text-text-primary"
            >
              {article.title}
            </h3>
            <p className="mt-1 font-mono text-xs text-text-muted">
              {article.source} · {article.lastModifiedTime}
            </p>
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                  viewMode === "preview"
                    ? "bg-accent text-background"
                    : "bg-background text-text-secondary hover:text-accent"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode("reader")}
                className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                  viewMode === "reader"
                    ? "bg-accent text-background"
                    : "bg-background text-text-secondary hover:text-accent"
                }`}
              >
                Reader
              </button>
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="rounded-lg bg-accent px-3 py-1.5 font-mono text-xs text-background transition-colors hover:bg-accent-dim"
            >
              Open original
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-background/80"
              aria-label="Close preview"
            >
              <svg
                className="h-5 w-5 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="mt-3 font-serif text-sm text-text-muted">
                Loading article…
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="font-serif text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => window.open(article.url, "_blank")}
                className="mt-4 font-mono text-sm text-accent hover:underline"
              >
                Open in new tab instead
              </button>
            </div>
          ) : (
            <div
              className={`max-w-none font-serif text-sm text-text-secondary [&_a]:text-accent ${
                viewMode === "reader" ? "leading-relaxed" : ""
              }`}
              // eslint-disable-next-line react/no-danger -- server-fetched preview HTML
              dangerouslySetInnerHTML={{ __html: content ?? "" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
