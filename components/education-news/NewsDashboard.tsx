"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsArticle } from "@/lib/education-news/types";
import type { StoredEducationNewsListItem } from "@/lib/education-news/stored-types";
import { StoredRepurposePanel } from "./StoredRepurposePanel";
import { EducationNewsArticlePreviewModal } from "./ArticlePreviewModal";
import { EducationNewsCard } from "./NewsCard";
import { EducationNewsEmptyState } from "./EmptyState";
import { EducationNewsLoadingSkeleton } from "./LoadingSkeleton";

interface NewsDashboardProps {
  initialArticles: NewsArticle[];
  initialSources: string[];
  initialStoredRows?: StoredEducationNewsListItem[];
}

export function EducationNewsDashboard({
  initialArticles,
  initialSources,
  initialStoredRows = [],
}: NewsDashboardProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [allArticles, setAllArticles] =
    useState<NewsArticle[]>(initialArticles);
  const [sources, setSources] = useState<string[]>(initialSources);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(initialSources),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const initialUrls = initialArticles.map((a) => a.url);
  const [seenArticleUrls, setSeenArticleUrls] = useState<Set<string>>(
    () => new Set(initialUrls),
  );
  const seenUrlsRef = useRef<Set<string>>(new Set(initialUrls));
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null,
  );
  const [storedSyncKey, setStoredSyncKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (selectedSources.size === 0) {
      setArticles([]);
    } else if (selectedSources.size === sources.length) {
      setArticles(allArticles);
    } else {
      const filtered = allArticles.filter((article) =>
        selectedSources.has(article.source),
      );
      setArticles(filtered);
    }
  }, [selectedSources, allArticles, sources.length]);

  const fetchShikshaClientSide = useCallback(async () => {
    try {
      const response = await fetch("/api/education-news/proxy/shiksha", {
        headers: { Accept: "application/xml,text/xml,*/*;q=0.9" },
        cache: "no-store",
      });
      if (response.ok) {
        await response.text();
      }
    } catch {
      /* optional client-side Shiksha fetch */
    }
  }, []);

  const handleRefresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsRefreshing(true);
    try {
      const response = await fetch("/api/education-news");
      const data = (await response.json()) as {
        articles: NewsArticle[];
        sources: string[];
      };

      const newArticles = data.articles.filter(
        (article) => !seenUrlsRef.current.has(article.url),
      );

      if (
        newArticles.length > 0 &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification("New education news", {
          body: `${newArticles.length} new article${newArticles.length > 1 ? "s" : ""} available`,
          icon: "/favicon.ico",
        });
      }

      setAllArticles(data.articles);
      setTimeout(() => {
        const next = new Set(data.articles.map((a: NewsArticle) => a.url));
        seenUrlsRef.current = next;
        setSeenArticleUrls(next);
      }, 5000);
      setSources(data.sources);
      setLastRefresh(new Date());
      setStoredSyncKey((k) => k + 1);
    } catch (error) {
      console.error("Error refreshing news:", error);
    } finally {
      if (!opts?.silent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchShikshaClientSide();
  }, [fetchShikshaClientSide]);

  useEffect(() => {
    void handleRefresh({ silent: true });
  }, [handleRefresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      void handleRefresh();
      void fetchShikshaClientSide();
    }, 60_000);
    return () => clearInterval(interval);
  }, [handleRefresh, fetchShikshaClientSide]);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      void Notification.requestPermission();
    }
  }, []);

  const toggleSource = (source: string) => {
    const next = new Set(selectedSources);
    if (next.has(source)) next.delete(source);
    else next.add(source);
    setSelectedSources(next);
  };

  const selectAllSources = () => {
    setSelectedSources(new Set(sources));
  };

  const deselectAllSources = () => {
    setSelectedSources(new Set());
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-2xl tracking-tight text-text-primary md:text-3xl">
          Latest education news
        </h1>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          Real-time articles from education sitemaps (today in IST), same sources
          as the{" "}
          <a
            href="https://github.com/lariyaharsh88/news-aggregator"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-accent hover:underline"
          >
            news-aggregator
          </a>{" "}
          project.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-surface/80 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-xs uppercase tracking-wide text-text-muted">
                Filter by source
              </h2>
              <button
                type="button"
                onClick={selectAllSources}
                className="font-mono text-xs text-accent hover:underline"
              >
                Select all
              </button>
              <span className="text-text-muted">|</span>
              <button
                type="button"
                onClick={deselectAllSources}
                className="font-mono text-xs text-accent hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <label
                  key={source}
                  className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 font-mono text-xs transition-all duration-200 ${
                    selectedSources.has(source)
                      ? "border-accent/50 bg-accent/15 text-accent"
                      : "border-border bg-background/50 text-text-secondary hover:border-accent/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSources.has(source)}
                    onChange={() => toggleSource(source)}
                    className="sr-only"
                  />
                  <span>{source}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center rounded-xl border border-accent bg-accent px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className={`mr-2 h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
            <p className="font-mono text-[10px] text-text-muted">
              Last updated:{" "}
              {mounted && lastRefresh
                ? lastRefresh.toLocaleTimeString("en-IN")
                : "—"}
            </p>
            <p className="font-mono text-[10px] text-text-muted">
              Auto-refresh: 60s
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="font-serif text-sm text-text-secondary">
          Showing{" "}
          <span className="font-semibold text-text-primary">
            {articles.length}
          </span>{" "}
          {articles.length === 1 ? "article" : "articles"}
          {selectedSources.size < sources.length ? (
            <span className="text-text-muted">
              {" "}
              from {selectedSources.size} selected{" "}
              {selectedSources.size === 1 ? "source" : "sources"}
            </span>
          ) : null}
        </p>
      </div>

      {isRefreshing && articles.length === 0 ? (
        <EducationNewsLoadingSkeleton />
      ) : articles.length === 0 ? (
        <EducationNewsEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <EducationNewsCard
              key={`${article.url}-${index}`}
              article={article}
              isNew={!seenArticleUrls.has(article.url)}
              onPreview={() => setSelectedArticle(article)}
            />
          ))}
        </div>
      )}

      {selectedArticle ? (
        <EducationNewsArticlePreviewModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      ) : null}

      <StoredRepurposePanel
        initialItems={initialStoredRows}
        syncKey={storedSyncKey}
      />
    </div>
  );
}
