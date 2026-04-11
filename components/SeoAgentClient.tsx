"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArticleCopyBar } from "@/components/ArticleCopyBar";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { ResearchImagesPanel } from "@/components/ResearchImagesPanel";
import { KeywordsPanel } from "@/components/KeywordsPanel";
import { LiveLog } from "@/components/LiveLog";
import { PipelineProgress } from "@/components/PipelineProgress";
import { SeoPackage } from "@/components/SeoPackage";
import { SourcesList } from "@/components/SourcesList";
import { ArticleSeoScorecard } from "@/components/ArticleSeoScorecard";
import { TopicForm } from "@/components/TopicForm";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { runArticlePipeline } from "@/lib/article-pipeline";
import { computeArticleSeoScore } from "@/lib/article-seo-score";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import type { GscQueryRow } from "@/lib/gsc-queries";
import type {
  FeaturedSnippet,
  Keyword,
  PipelineInput,
  SeoMeta,
  Source,
} from "@/lib/types";

const ArticleEditor = dynamic(
  () =>
    import("@/components/ArticleEditor").then((mod) => ({
      default: mod.ArticleEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="animate-pulse font-mono text-sm text-text-muted">
        Loading editor…
      </p>
    ),
  },
);

type TabId = "article" | "score" | "seo" | "keywords" | "sources" | "log";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function SeoAgentClient() {
  const [input, setInput] = useState<PipelineInput>({
    topic: "",
    audience: "",
    intent: "informational",
    sourceUrl: "",
    primaryKeyword: "",
  });
  const [gscRows, setGscRows] = useState<GscQueryRow[]>([]);
  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
  const [loadingGsc, setLoadingGsc] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);
  const [gscNote, setGscNote] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [searchConsoleConfigured, setSearchConsoleConfigured] =
    useState(false);

  useEffect(() => {
    void fetch("/api/config")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (isRecord(d) && typeof d.searchConsole === "boolean") {
          setSearchConsoleConfigured(d.searchConsole);
        }
      })
      .catch(() => setSearchConsoleConfigured(false));
  }, []);
  const [tab, setTab] = useState<TabId>("article");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [doneStages, setDoneStages] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [article, setArticle] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [paas, setPaas] = useState<string[]>([]);
  const [featuredSnippet, setFeaturedSnippet] = useState<FeaturedSnippet | null>(
    null,
  );
  const [meta, setMeta] = useState<SeoMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Bumps when article generation finishes so the rich editor remounts with full Markdown. */
  const [articleEditorEpoch, setArticleEditorEpoch] = useState(0);
  /** Last pipeline research bundle (for Pollinations image prompts). */
  const [storedResearchContext, setStoredResearchContext] = useState("");
  const [storedResearchTopic, setStoredResearchTopic] = useState("");

  const canRun =
    Boolean(input.topic.trim() || input.sourceUrl.trim()) && !running;

  const topicFirstLine =
    input.topic.trim().split("\n")[0]?.trim() ?? "";

  const seoScoreResult = useMemo(
    () =>
      computeArticleSeoScore(article, meta, keywords, {
        primaryKeyword: input.primaryKeyword,
        topicFirstLine,
      }),
    [article, meta, keywords, input.primaryKeyword, topicFirstLine],
  );

  const showSeoScore = article.trim().length >= 40 && !running;

  const handleFetchSearchConsole = useCallback(async () => {
    setLoadingGsc(true);
    setGscError(null);
    setGscNote(null);
    try {
      const pageUrl = input.sourceUrl.trim() || undefined;
      const res = await fetch("/api/search-console-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `HTTP ${res.status}`;
        const hint =
          isRecord(data) && typeof data.hint === "string" ? data.hint : "";
        throw new Error(hint ? `${msg}\n\n${hint}` : msg);
      }
      const details = isRecord(data) && Array.isArray(data.details)
        ? data.details
        : [];
      const rows: GscQueryRow[] = details
        .filter(
          (r): r is Record<string, unknown> =>
            typeof r === "object" && r !== null,
        )
        .map((r) => ({
          query: typeof r.query === "string" ? r.query : "",
          clicks: typeof r.clicks === "number" ? r.clicks : 0,
          impressions:
            typeof r.impressions === "number" ? r.impressions : 0,
        }))
        .filter((r) => r.query.length > 0);
      setGscRows(rows);
      const note =
        isRecord(data) && typeof data.note === "string" ? data.note : null;
      setGscNote(note);
    } catch (e) {
      setGscError(e instanceof Error ? e.message : "Search Console failed");
      setGscRows([]);
      setGscNote(null);
    } finally {
      setLoadingGsc(false);
    }
  }, [input.sourceUrl]);

  const handleFetchGoogleSuggestions = useCallback(async () => {
    const q =
      input.primaryKeyword.trim() ||
      input.topic.trim().split("\n")[0]?.trim() ||
      "";
    if (q.length < 2) {
      setSuggestError("Add a primary keyword or topic line first.");
      return;
    }
    setLoadingSuggest(true);
    setSuggestError(null);
    try {
      const res = await fetch(
        `/api/google-suggest?q=${encodeURIComponent(q)}`,
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const list =
        isRecord(data) && Array.isArray(data.suggestions)
          ? data.suggestions.filter((s): s is string => typeof s === "string")
          : [];
      setGoogleSuggestions(list);
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : "Suggestions failed");
      setGoogleSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }, [input.primaryKeyword, input.topic]);

  const pushLog = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLogLines((prev) => [...prev, line]);
  }, []);

  const runPipeline = useCallback(async () => {
    if (!input.topic.trim() && !input.sourceUrl.trim()) return;
    setRunning(true);
    setError(null);
    setLogLines([]);
    setDoneStages([]);
    setStage(null);
    setArticle("");
    setMeta(null);
    setKeywords([]);
    setSources([]);
    setPaas([]);
    setFeaturedSnippet(null);
    setStoredResearchContext("");
    setStoredResearchTopic("");
    setTab("article");

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    try {
      await runArticlePipeline(
        {
          topic: input.topic,
          audience: input.audience,
          intent: input.intent,
          sourceUrl: input.sourceUrl,
          primaryKeyword: input.primaryKeyword,
          searchConsoleQueries: gscRows.map((r) => r.query),
          googleSuggestions,
        },
        {
          onStage: setStage,
          onDoneStage: markDone,
          onLog: pushLog,
          onKeywords: setKeywords,
          onSources: setSources,
          onPaas: setPaas,
          onFeaturedSnippet: setFeaturedSnippet,
          onArticleDelta: (delta) => setArticle((prev) => prev + delta),
          onMeta: setMeta,
          onResearchTopic: setStoredResearchTopic,
          onResearchContext: setStoredResearchContext,
        },
      );
      setArticleEditorEpoch((n) => n + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected pipeline error";
      setError(msg);
      pushLog(`Fatal: ${msg}`);
    } finally {
      setRunning(false);
      setStage(null);
    }
  }, [input, pushLog, gscRows, googleSuggestions]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "article", label: "Article" },
    { id: "score", label: "SEO score" },
    { id: "seo", label: "SEO package" },
    { id: "keywords", label: "Keywords" },
    { id: "sources", label: "Sources" },
    { id: "log", label: "Live log" },
  ];

  return (
    <main className="mx-auto flex min-w-0 max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:py-10 md:px-6">
      <p className="font-mono text-xs">
        <Link
          href="/"
          className="text-text-muted transition-colors hover:text-accent"
        >
          ← All tools
        </Link>
      </p>
      <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Next.js · Gemini · Tavily · Serper
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl text-text-primary sm:text-4xl md:text-5xl">
              RankFlowHQ · Article pipeline
            </h1>
            <p className="mt-2 max-w-2xl font-serif text-base text-text-secondary sm:text-lg">
              From SERP signals to a streaming long-form draft, with research
              citations and an exportable SEO pack.
            </p>
          </div>
          <span className="w-fit shrink-0 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            Free-tier APIs
          </span>
        </div>
      </header>

      {ADSENSE_SLOTS.toolInline ? (
        <div className="space-y-2">
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Advertisement
          </p>
          <AdSenseSlot
            slot={ADSENSE_SLOTS.toolInline}
            className="flex justify-center"
            minHeight={90}
          />
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <TopicForm
            value={input}
            onChange={setInput}
            disabled={running}
            gscRows={gscRows}
            googleSuggestions={googleSuggestions}
            onFetchSearchConsole={() => void handleFetchSearchConsole()}
            onFetchGoogleSuggestions={() => void handleFetchGoogleSuggestions()}
            loadingGsc={loadingGsc}
            loadingSuggest={loadingSuggest}
            gscError={gscError}
            gscNote={gscNote}
            suggestError={suggestError}
            searchConsoleConfigured={searchConsoleConfigured}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => void runPipeline()}
              disabled={!canRun}
              className="touch-manipulation w-full rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-all duration-200 enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {running ? "Running pipeline…" : "Run pipeline"}
            </button>
            <span className="font-mono text-[11px] text-text-muted sm:text-xs">
              Using server keys from `.env.local`.
            </span>
          </div>

          <div className="lg:hidden">
            <PipelineProgress
              stages={PIPELINE_STAGES}
              currentStage={stage}
              doneStages={doneStages}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 font-mono text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface/80">
            <div
              className="custom-scrollbar flex gap-1 overflow-x-auto border-b border-border p-2 [-webkit-overflow-scrolling:touch]"
              role="tablist"
              aria-label="Output views"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`touch-manipulation whitespace-nowrap rounded-md px-2.5 py-2 font-mono text-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent sm:px-3 sm:text-xs ${
                    tab === t.id
                      ? "bg-accent text-background"
                      : "text-text-secondary hover:bg-background/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="custom-scrollbar max-h-[min(70vh,32rem)] overflow-y-auto p-3 sm:max-h-[70vh] sm:p-4">
              {tab === "article" && (
                <div>
                  <ArticleCopyBar markdown={article} disabled={running} />
                  <ResearchImagesPanel
                    topic={
                      storedResearchTopic.trim() ||
                      input.topic.trim().split("\n")[0]?.trim() ||
                      "Article"
                    }
                    audience={input.audience}
                    researchContext={storedResearchContext}
                    article={article}
                    disableArticleMutation={running}
                    onApplyArticle={setArticle}
                    onRemountEditor={() =>
                      setArticleEditorEpoch((e) => e + 1)
                    }
                  />
                  {running ? (
                    <ArticleRenderer markdown={article} streaming />
                  ) : (
                    <ArticleEditor
                      key={articleEditorEpoch}
                      markdown={article}
                      onChange={setArticle}
                    />
                  )}
                  {showSeoScore ? (
                    <div className="mt-6">
                      <ArticleSeoScorecard result={seoScoreResult} compact />
                    </div>
                  ) : null}
                </div>
              )}
              {tab === "score" &&
                (showSeoScore ? (
                  <ArticleSeoScorecard result={seoScoreResult} />
                ) : (
                  <p className="font-serif text-text-secondary">
                    Add or generate article text first (about 40+ characters). Scores
                    use your markdown, the SEO package from the audit stage when
                    available, and your keyword list.
                  </p>
                ))}
              {tab === "seo" && <SeoPackage meta={meta} article={article} />}
              {tab === "keywords" && (
                <KeywordsPanel
                  keywords={keywords}
                  paas={paas}
                  featuredSnippet={featuredSnippet}
                  gscRows={gscRows}
                  googleSuggestions={googleSuggestions}
                />
              )}
              {tab === "sources" && <SourcesList sources={sources} />}
              {tab === "log" && <LiveLog lines={logLines} />}
            </div>
          </div>
        </div>

        <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
          <PipelineProgress
            stages={PIPELINE_STAGES}
            currentStage={stage}
            doneStages={doneStages}
          />
        </aside>
      </div>
    </main>
  );
}
