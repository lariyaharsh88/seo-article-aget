"use client";

import { useCallback, useEffect, useState } from "react";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { KeywordsPanel } from "@/components/KeywordsPanel";
import { LiveLog } from "@/components/LiveLog";
import { PipelineProgress } from "@/components/PipelineProgress";
import { SeoPackage } from "@/components/SeoPackage";
import { SourcesList } from "@/components/SourcesList";
import { TopicForm } from "@/components/TopicForm";
import { isKeywordRecord } from "@/lib/keyword-guards";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import type { GscQueryRow } from "@/lib/gsc-queries";
import type {
  FeaturedSnippet,
  Keyword,
  PipelineInput,
  SeoMeta,
  Source,
} from "@/lib/types";

type TabId = "article" | "seo" | "keywords" | "sources" | "log";

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFeaturedSnippet(v: unknown): v is FeaturedSnippet {
  if (typeof v !== "object" || v === null) return false;
  const o = v as FeaturedSnippet;
  return typeof o.text === "string" && o.text.trim().length > 0;
}

export default function Home() {
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

  const canRun =
    Boolean(input.topic.trim() || input.sourceUrl.trim()) && !running;

  const handleFetchSearchConsole = useCallback(async () => {
    setLoadingGsc(true);
    setGscError(null);
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
        throw new Error(msg);
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
    } catch (e) {
      setGscError(e instanceof Error ? e.message : "Search Console failed");
      setGscRows([]);
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
    setTab("article");

    const headers = buildHeaders();
    let keywordList: Keyword[] = [];
    let researchContext = "";
    let sourcesList: Source[] = [];
    let organic = "";
    let paasList: string[] = [];
    let relatedList: string[] = [];
    let queriesList: string[] = [];
    let outlineText = "";
    let articleBody = "";

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    try {
      let workingTopic = input.topic.trim();
      if (!workingTopic && input.sourceUrl.trim()) {
        pushLog("Brief: resolving title from URL…");
        try {
          const metaRes = await fetch(
            `/api/page-meta?url=${encodeURIComponent(input.sourceUrl.trim())}`,
          );
          const meta: unknown = await metaRes.json();
          if (
            metaRes.ok &&
            isRecord(meta) &&
            typeof meta.title === "string" &&
            meta.title.trim()
          ) {
            workingTopic = meta.title.trim();
          } else {
            workingTopic = input.sourceUrl.trim();
          }
        } catch {
          workingTopic = input.sourceUrl.trim();
        }
        pushLog(`Brief: using “${workingTopic.slice(0, 72)}${workingTopic.length > 72 ? "…" : ""}”.`);
      }

      setStage("keywords");
      pushLog("Keywords: requesting Serper + Gemini…");
      try {
        const res = await fetch("/api/keywords", {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: workingTopic,
            intent: input.intent,
            audience: input.audience,
            sourceUrl: input.sourceUrl.trim(),
            primaryKeyword: input.primaryKeyword.trim(),
            searchConsoleQueries: gscRows.map((r) => r.query),
            googleSuggestions,
          }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (isRecord(data) && Array.isArray(data.keywords)) {
          keywordList = data.keywords.filter(isKeywordRecord);
        }
        setKeywords(keywordList);
        markDone("keywords");
        pushLog(`Keywords: ${keywordList.length} items.`);
      } catch (e) {
        pushLog(
          `Keywords: degraded — ${e instanceof Error ? e.message : "error"}`,
        );
      }

      setStage("research");
      pushLog("Research: Tavily deep + stats pass…");
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: workingTopic,
            sourceUrl: input.sourceUrl.trim() || undefined,
          }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (isRecord(data)) {
          researchContext =
            typeof data.context === "string" ? data.context : "";
          if (Array.isArray(data.results)) {
            sourcesList = data.results.filter(
              (s): s is Source =>
                typeof s === "object" &&
                s !== null &&
                typeof (s as Source).url === "string",
            );
          }
        }
        setSources(sourcesList);
        markDone("research");
        pushLog(`Research: ${sourcesList.length} unique sources.`);
      } catch (e) {
        pushLog(
          `Research: degraded — ${e instanceof Error ? e.message : "error"}`,
        );
      }

      setStage("serp");
      pushLog("SERP: organic, PAA, related…");
      try {
        const res = await fetch("/api/serp", {
          method: "POST",
          headers,
          body: JSON.stringify({ topic: workingTopic }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        let serpFeatured: FeaturedSnippet | null = null;
        if (isRecord(data)) {
          organic = typeof data.organic === "string" ? data.organic : "";
          if (Array.isArray(data.paas)) {
            paasList = data.paas.filter(
              (p): p is string => typeof p === "string",
            );
          }
          if (Array.isArray(data.related)) {
            relatedList = data.related.filter(
              (p): p is string => typeof p === "string",
            );
          }
          if (isFeaturedSnippet(data.featuredSnippet)) {
            serpFeatured = data.featuredSnippet;
          }
        }
        setFeaturedSnippet(serpFeatured);
        setPaas(paasList);
        markDone("serp");
        pushLog(`SERP: ${paasList.length} PAA questions.`);
      } catch (e) {
        pushLog(`SERP: degraded — ${e instanceof Error ? e.message : "error"}`);
      }

      setStage("queries");
      pushLog("Queries: clustering searcher phrasing…");
      try {
        const res = await fetch("/api/queries", {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: workingTopic,
            related: relatedList,
            paas: paasList,
          }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (isRecord(data) && Array.isArray(data.queries)) {
          queriesList = data.queries.filter(
            (q): q is string => typeof q === "string",
          );
        }
        markDone("queries");
        pushLog(`Queries: ${queriesList.length} clustered.`);
      } catch (e) {
        queriesList = [...relatedList, ...paasList].slice(0, 10);
        pushLog(
          `Queries: degraded — ${e instanceof Error ? e.message : "error"}`,
        );
        markDone("queries");
      }

      setStage("outline");
      pushLog("Outline: Gemini structural pass…");
      try {
        const res = await fetch("/api/outline", {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: workingTopic,
            audience: input.audience,
            intent: input.intent,
            keywords: keywordList,
            researchContext,
            serpContext: organic,
            paas: paasList,
            queries: queriesList,
          }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        outlineText =
          isRecord(data) && typeof data.outline === "string"
            ? data.outline
            : "";
        markDone("outline");
        pushLog("Outline: ready.");
      } catch (e) {
        outlineText = `# ${workingTopic}\n\n## Introduction\n### Hook\n### Scope\n`;
        pushLog(
          `Outline: degraded — ${e instanceof Error ? e.message : "error"}`,
        );
        markDone("outline");
      }

      setStage("article");
      pushLog("Article: streaming from Gemini…");
      try {
        const res = await fetch("/api/article", {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: workingTopic,
            audience: input.audience,
            intent: input.intent,
            keywords: keywordList,
            researchContext,
            outlineText,
            paas: paasList,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const block of parts) {
            const line = block.trim();
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (raw === "[DONE]") continue;
            let parsed: { text?: string; error?: string } | null = null;
            try {
              parsed = JSON.parse(raw) as { text?: string; error?: string };
            } catch {
              continue;
            }
            if (parsed?.error) throw new Error(parsed.error);
            if (parsed?.text) {
              articleBody += parsed.text;
              setArticle((prev) => prev + parsed.text);
            }
          }
        }
        markDone("article");
        pushLog("Article: stream complete.");
      } catch (e) {
        pushLog(
          `Article: failed — ${e instanceof Error ? e.message : "error"}`,
        );
      }

      setStage("audit");
      pushLog("Audit: SEO meta JSON…");
      try {
        const focus =
          keywordList.find((k) => k.type === "primary")?.keyword ??
          workingTopic;
        const res = await fetch("/api/audit", {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: workingTopic,
            article: articleBody,
            focusKeyword: focus,
          }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (
          isRecord(data) &&
          typeof data.meta === "object" &&
          data.meta !== null
        ) {
          const m = data.meta as SeoMeta;
          setMeta(m);
        }
        markDone("audit");
        pushLog("Audit: meta package ready.");
      } catch (e) {
        pushLog(
          `Audit: degraded — ${e instanceof Error ? e.message : "error"}`,
        );
      }

      setStage(null);
      pushLog("Pipeline finished.");
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
    { id: "seo", label: "SEO package" },
    { id: "keywords", label: "Keywords" },
    { id: "sources", label: "Sources" },
    { id: "log", label: "Live log" },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="space-y-3 border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Next.js · Gemini · Tavily · Serper
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-text-primary md:text-5xl">
              SEO Article Agent
            </h1>
            <p className="mt-2 max-w-2xl font-serif text-lg text-text-secondary">
              From SERP signals to a streaming long-form draft, with research
              citations and an exportable SEO pack.
            </p>
          </div>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            Free-tier APIs
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
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
            suggestError={suggestError}
            searchConsoleConfigured={searchConsoleConfigured}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void runPipeline()}
              disabled={!canRun}
              className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-all duration-200 enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? "Running pipeline…" : "Run pipeline"}
            </button>
            <span className="font-mono text-xs text-text-muted">
              Using server keys from `.env.local`.
            </span>
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
              className="custom-scrollbar flex gap-1 overflow-x-auto border-b border-border p-2"
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
                  className={`whitespace-nowrap rounded-md px-3 py-2 font-mono text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
                    tab === t.id
                      ? "bg-accent text-background"
                      : "text-text-secondary hover:bg-background/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="custom-scrollbar max-h-[70vh] overflow-y-auto p-4">
              {tab === "article" && (
                <ArticleRenderer markdown={article} streaming={running} />
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

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
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
