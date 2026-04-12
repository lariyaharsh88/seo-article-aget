"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArticleCopyBar } from "@/components/ArticleCopyBar";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { ResearchImagesPanel } from "@/components/ResearchImagesPanel";
import { KeywordsPanel } from "@/components/KeywordsPanel";
import { LiveLog } from "@/components/LiveLog";
import { PipelineProgress } from "@/components/PipelineProgress";
import { SeoPackage } from "@/components/SeoPackage";
import { SourcesList } from "@/components/SourcesList";
import { ArticleSeoScorecard } from "@/components/ArticleSeoScorecard";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { runArticlePipeline } from "@/lib/article-pipeline";
import { computeArticleSeoScore } from "@/lib/article-seo-score";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
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
  | "seo"
  | "keywords"
  | "sources"
  | "log"
  | "visual";

function isValidHttpUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function RepurposeUrlClient() {
  const [input, setInput] = useState<PipelineInput>({
    topic: "",
    audience: "general readers",
    intent: "informational",
    sourceUrl: "",
    primaryKeyword: "",
  });
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
  const [articleEditorEpoch, setArticleEditorEpoch] = useState(0);
  const [storedResearchContext, setStoredResearchContext] = useState("");
  const [storedResearchTopic, setStoredResearchTopic] = useState("");
  const [enrichedHtml, setEnrichedHtml] = useState("");
  const [autoEnrich, setAutoEnrich] = useState(true);

  const canRun = isValidHttpUrl(input.sourceUrl) && !running;

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

  const pushLog = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLogLines((prev) => [...prev, line]);
  }, []);

  const runPipeline = useCallback(async () => {
    if (!isValidHttpUrl(input.sourceUrl)) return;
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
    setTab("article");

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    try {
      const result = await runArticlePipeline(
        {
          topic: input.topic.trim(),
          audience: input.audience.trim() || "general readers",
          intent: input.intent,
          sourceUrl: input.sourceUrl.trim(),
          primaryKeyword: input.primaryKeyword.trim(),
          searchConsoleQueries: [],
          googleSuggestions: [],
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
  }, [input, pushLog, autoEnrich]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "article", label: "Article" },
    { id: "visual", label: "Visual HTML" },
    { id: "score", label: "SEO score" },
    { id: "seo", label: "SEO package" },
    { id: "keywords", label: "Keywords" },
    { id: "sources", label: "Sources" },
    { id: "log", label: "Live log" },
  ];

  const researchLabel =
    storedResearchTopic.trim() ||
    topicFirstLine ||
    input.sourceUrl.trim() ||
    "Article";

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
          URL → full pipeline
        </p>
        <h1 className="font-display text-3xl text-text-primary sm:text-4xl md:text-5xl">
          Repurpose from URL
        </h1>
        <p className="max-w-2xl font-serif text-base text-text-secondary sm:text-lg">
          Paste any public article URL. RankFlowHQ runs the same keyword →
          research → SERP → outline → streaming article → SEO audit pipeline as
          the main article tool, using the page title (and Tavily context) so you
          get a fresh, SEO-oriented draft—not a verbatim copy.
        </p>
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
          <div className="space-y-4 rounded-xl border border-border bg-surface/80 p-4 sm:p-6">
            <div>
              <label
                htmlFor="repurpose-source-url"
                className="font-mono text-xs text-text-muted"
              >
                Article or page URL <span className="text-accent">*</span>
              </label>
              <input
                id="repurpose-source-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://example.com/blog/your-article"
                value={input.sourceUrl}
                disabled={running}
                onChange={(e) =>
                  setInput((prev) => ({ ...prev, sourceUrl: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-text-primary outline-none ring-accent/30 focus:border-accent focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="repurpose-topic"
                className="font-mono text-xs text-text-muted"
              >
                Topic override{" "}
                <span className="text-text-muted/80">(optional)</span>
              </label>
              <textarea
                id="repurpose-topic"
                rows={2}
                placeholder="Leave empty to use the live page title from the URL."
                value={input.topic}
                disabled={running}
                onChange={(e) =>
                  setInput((prev) => ({ ...prev, topic: e.target.value }))
                }
                className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/30 focus:border-accent focus:ring-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="repurpose-audience"
                  className="font-mono text-xs text-text-muted"
                >
                  Audience
                </label>
                <input
                  id="repurpose-audience"
                  type="text"
                  value={input.audience}
                  disabled={running}
                  onChange={(e) =>
                    setInput((prev) => ({ ...prev, audience: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/30 focus:border-accent focus:ring-2"
                />
              </div>
              <div>
                <label
                  htmlFor="repurpose-intent"
                  className="font-mono text-xs text-text-muted"
                >
                  Intent
                </label>
                <select
                  id="repurpose-intent"
                  value={input.intent}
                  disabled={running}
                  onChange={(e) =>
                    setInput((prev) => ({
                      ...prev,
                      intent: e.target.value as PipelineInput["intent"],
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary outline-none ring-accent/30 focus:border-accent focus:ring-2"
                >
                  <option value="informational">Informational</option>
                  <option value="commercial">Commercial</option>
                  <option value="transactional">Transactional</option>
                  <option value="navigational">Navigational</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="repurpose-pk"
                className="font-mono text-xs text-text-muted"
              >
                Primary keyword{" "}
                <span className="text-text-muted/80">(optional)</span>
              </label>
              <input
                id="repurpose-pk"
                type="text"
                placeholder="Defaults from topic / page title if empty"
                value={input.primaryKeyword}
                disabled={running}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    primaryKeyword: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary outline-none ring-accent/30 focus:border-accent focus:ring-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => void runPipeline()}
              disabled={!canRun}
              className="touch-manipulation w-full rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-all duration-200 enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {running ? "Running pipeline…" : "Run full pipeline"}
            </button>
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-text-secondary sm:text-xs">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                disabled={running}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Auto-enrich (H2 images, charts, tables)
            </label>
            <span className="font-mono text-[11px] text-text-muted sm:text-xs">
              Same APIs as /seo-agent — keys in env.
            </span>
          </div>

          <div className="lg:hidden">
            <PipelineProgress
              stages={PIPELINE_STAGES}
              currentStage={stage}
              doneStages={doneStages}
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 font-mono text-sm text-red-200"
            >
              {error}
            </div>
          ) : null}

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
                        Publish-ready HTML from /api/seo-enrich.
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
                    Enable <span className="font-mono text-accent">Auto-enrich</span>{" "}
                    and run the pipeline. Visual HTML appears here when the run
                    completes.
                  </p>
                ))}
              {tab === "article" && (
                <div>
                  <ArticleCopyBar markdown={article} disabled={running} />
                  <ResearchImagesPanel
                    topic={researchLabel}
                    audience={input.audience}
                    researchContext={storedResearchContext}
                    article={article}
                    disableArticleMutation={running}
                    onApplyArticle={setArticle}
                    onRemountEditor={() => setArticleEditorEpoch((e) => e + 1)}
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
                    Generate an article first (about 40+ characters) to see scores.
                  </p>
                ))}
              {tab === "seo" && <SeoPackage meta={meta} article={article} />}
              {tab === "keywords" && (
                <KeywordsPanel
                  keywords={keywords}
                  paas={paas}
                  featuredSnippet={featuredSnippet}
                  gscRows={[]}
                  googleSuggestions={[]}
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
