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
import { ArticleGeoPanel } from "@/components/ArticleGeoPanel";
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

type TabId =
  | "article"
  | "score"
  | "geo"
  | "seo"
  | "keywords"
  | "sources"
  | "log"
  | "visual";

type PipelineMode = "simple" | "advanced";
type ArticleViewMode = "edit" | "preview";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function SeoAgentClient() {
  const [mode, setMode] = useState<PipelineMode>("simple");
  const [input, setInput] = useState<PipelineInput>({
    topic: "",
    audience: "",
    intent: "informational",
    sourceUrl: "",
    primaryKeyword: "",
  });
  const [simpleKeyword, setSimpleKeyword] = useState("");
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
  /** Final-step HTML from POST /api/seo-enrich (H2 images, QuickChart, comparison tables). */
  const [enrichedHtml, setEnrichedHtml] = useState("");
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [articleViewMode, setArticleViewMode] = useState<ArticleViewMode>("edit");

  const canRun =
    mode === "simple"
      ? simpleKeyword.trim().length > 0 && !running
      : Boolean(input.topic.trim() || input.sourceUrl.trim()) && !running;

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
    const effectiveInput: PipelineInput =
      mode === "simple"
        ? {
            topic: simpleKeyword.trim(),
            audience: "general readers",
            intent: "informational",
            sourceUrl: "",
            primaryKeyword: simpleKeyword.trim(),
          }
        : input;

    if (!effectiveInput.topic.trim() && !effectiveInput.sourceUrl.trim()) return;
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
    setEnrichedHtml("");
    setArticleViewMode("edit");
    setTab("article");

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const hasSourceUrl = effectiveInput.sourceUrl.trim().length > 0;
    const gscFallbackToSiteWide =
      typeof gscNote === "string" &&
      gscNote.toLowerCase().includes("showing site-wide top queries instead");
    const searchConsoleQueriesForArticle =
      hasSourceUrl && !gscFallbackToSiteWide
        ? gscRows.map((r) => r.query)
        : [];

    try {
      const result = await runArticlePipeline(
        {
          topic: effectiveInput.topic,
          audience: effectiveInput.audience,
          intent: effectiveInput.intent,
          sourceUrl: effectiveInput.sourceUrl,
          primaryKeyword: effectiveInput.primaryKeyword,
          searchConsoleQueries: searchConsoleQueriesForArticle,
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
          ...(autoEnrich
            ? { onEnrichedHtml: (html: string) => setEnrichedHtml(html) }
            : {}),
        },
      );
      if (result.enrichedHtml) {
        setTab("visual");
      }
      setArticleEditorEpoch((n) => n + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected pipeline error";
      setError(msg);
      pushLog(`Fatal: ${msg}`);
    } finally {
      setRunning(false);
      setStage(null);
    }
  }, [mode, simpleKeyword, input, pushLog, gscRows, gscNote, googleSuggestions, autoEnrich]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "article", label: "Article" },
    { id: "visual", label: "Visual HTML" },
    { id: "score", label: "SEO score" },
    { id: "geo", label: "GEO panel" },
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
            <p className="mt-2 font-mono text-xs text-text-muted">
              Have only a URL?{" "}
              <Link
                href="/repurpose-url"
                className="text-accent underline-offset-2 hover:underline"
              >
                Repurpose from URL
              </Link>{" "}
              runs the same pipeline from a single link.
            </p>
          </div>
          <span className="w-fit shrink-0 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            Free-tier APIs
          </span>
        </div>
        <div className="mt-4 inline-flex rounded-lg border border-border bg-surface/70 p-1">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              mode === "simple"
                ? "bg-accent text-background"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => setMode("advanced")}
            className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              mode === "advanced"
                ? "bg-accent text-background"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Advanced Mode
          </button>
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
          {mode === "simple" ? (
            <section className="rounded-xl border border-border bg-surface/80 p-4">
              <h2 className="font-mono text-sm uppercase text-accent">
                Simple brief
              </h2>
              <p className="mt-2 font-serif text-sm text-text-secondary">
                Add one keyword and generate a full article in one click.
              </p>
              <label className="mt-3 block text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Keyword</span>
                <input
                  type="text"
                  value={simpleKeyword}
                  onChange={(e) => setSimpleKeyword(e.target.value)}
                  placeholder="e.g. how to rank in chatgpt search"
                  disabled={running}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </section>
          ) : (
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
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => void runPipeline()}
              disabled={!canRun}
              className="touch-manipulation w-full rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-all duration-200 enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {running
                ? "Running pipeline…"
                : mode === "simple"
                  ? "Generate Article"
                  : "Run pipeline"}
            </button>
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-text-secondary sm:text-xs">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                disabled={running}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Auto-enrich (H2 images, charts, tables — last step)
            </label>
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
              {tab === "visual" &&
                (enrichedHtml.trim() ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void navigator.clipboard.writeText(enrichedHtml)
                        }
                        className="rounded-md border border-border bg-background/80 px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-accent hover:text-accent"
                      >
                        Copy HTML
                      </button>
                      <p className="font-mono text-[11px] text-text-muted">
                        Publish-ready HTML after the markdown article (images
                        under H2, QuickChart when data is found, tables for
                        comparisons).
                      </p>
                    </div>
                    <div
                      className="seo-enriched-preview rounded-lg border border-border bg-background/40 p-4 prose prose-invert max-w-none prose-headings:font-display prose-img:rounded-md"
                      // eslint-disable-next-line react/no-danger -- server-built publish HTML from our /api/seo-enrich
                      dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                    />
                  </div>
                ) : (
                  <p className="font-serif text-text-secondary">
                    Run the pipeline with{" "}
                    <span className="font-mono text-accent">Auto-enrich</span>{" "}
                    enabled (default). After the article and SEO audit, the
                    server builds visual HTML — open this tab when the run
                    finishes, or switch here if you disabled enrich.
                  </p>
                ))}
              {tab === "article" && (
                <div>
                  <ArticleCopyBar
                    markdown={article}
                    title={topicFirstLine || input.primaryKeyword || "Generated article"}
                    disabled={running}
                  />
                  <div className="mb-4 inline-flex rounded-lg border border-border bg-background/60 p-1">
                    <button
                      type="button"
                      onClick={() => setArticleViewMode("edit")}
                      className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                        articleViewMode === "edit"
                          ? "bg-accent text-background"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Edit Article
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleViewMode("preview")}
                      className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                        articleViewMode === "preview"
                          ? "bg-accent text-background"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Preview Article
                    </button>
                  </div>
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
                  {running || articleViewMode === "preview" ? (
                    <ArticleRenderer markdown={article} streaming={running} />
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
              {tab === "geo" && (
                <ArticleGeoPanel
                  article={article}
                  topic={topicFirstLine || input.topic.trim() || "this topic"}
                  primaryKeyword={input.primaryKeyword}
                />
              )}
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
