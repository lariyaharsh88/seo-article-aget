"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { BulkTopicRunProgress } from "@/components/blog/BulkTopicRunProgress";
import { LiveLog } from "@/components/LiveLog";
import { PipelineProgress } from "@/components/PipelineProgress";
import {
  DEFAULT_ARTICLE_PIPELINE_AUDIENCE,
  runArticlePipeline,
} from "@/lib/article-pipeline";
import { MAX_FULL_ARTICLE_TOPICS_PER_REQUEST } from "@/lib/article-bulk-limits";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

type ListRow = {
  id: string;
  title: string;
  topic: string;
  primaryKeyword: string | null;
  wordCount: number;
  createdAt: string;
  dashboardLink: string;
};

type TabKey = "generate" | string;

function parseCommaTopics(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim().replace(/\s+/g, " ");
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, 180));
  }
  return out.slice(0, MAX_FULL_ARTICLE_TOPICS_PER_REQUEST);
}

function parseCsvTopicColumn(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const head = lines[0].toLowerCase();
  const start =
    head === "topic" || head.startsWith("topic,") || head === '"topic"'
      ? 1
      : 0;
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const col =
      lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)[0]?.trim().replace(
        /^"|"$/g,
        "",
      ) ?? "";
    if (!col) continue;
    const key = col.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(col.slice(0, 180));
    if (out.length >= MAX_FULL_ARTICLE_TOPICS_PER_REQUEST) break;
  }
  return out;
}

function mergeTopicLists(a: string[], b: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...a, ...b]) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= MAX_FULL_ARTICLE_TOPICS_PER_REQUEST) break;
  }
  return out;
}

export function BulkArticleCreatingAgentClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [topicsText, setTopicsText] = useState("");
  const [csvHint, setCsvHint] = useState<string | null>(null);
  const [audience, setAudience] = useState(DEFAULT_ARTICLE_PIPELINE_AUDIENCE);

  const [items, setItems] = useState<ListRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("generate");

  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [doneStages, setDoneStages] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [article, setArticle] = useState("");
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);

  const [detail, setDetail] = useState<{
    id: string;
    title: string;
    topic: string;
    markdown: string;
    createdAt: string;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const topicList = useMemo(() => parseCommaTopics(topicsText), [topicsText]);

  const refreshList = useCallback(async (token: string) => {
    setListError(null);
    const res = await fetch("/api/user-articles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { items?: ListRow[]; error?: string };
    if (!res.ok) {
      throw new Error(data.error || `Could not load articles (${res.status})`);
    }
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !session?.access_token) {
      setListLoading(false);
      setItems([]);
      return;
    }
    setListLoading(true);
    void refreshList(session.access_token)
      .catch((e) =>
        setListError(e instanceof Error ? e.message : "Failed to load articles."),
      )
      .finally(() => setListLoading(false));
  }, [authChecked, session?.access_token, refreshList]);

  useEffect(() => {
    if (activeTab === "generate" || activeTab === "") return;
    const token = session?.access_token;
    if (!token) return;
    setDetailLoading(true);
    setDetail(null);
    void fetch(`/api/user-articles/${encodeURIComponent(activeTab)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          item?: {
            id: string;
            title: string;
            topic: string;
            markdown: string;
            createdAt: string;
          };
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Not found");
        }
        if (data.item) setDetail(data.item);
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [activeTab, session?.access_token]);

  const pushLog = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLogLines((prev) => [...prev, line]);
  }, []);

  async function onCsvFile(file: File | null) {
    setCsvHint(null);
    if (!file) return;
    const text = await file.text();
    const fromCsv = parseCsvTopicColumn(text);
    if (fromCsv.length === 0) {
      setCsvHint("No topics found. Use one topic per row or a column named topic.");
      return;
    }
    const merged = mergeTopicLists(topicList, fromCsv);
    setTopicsText(merged.join(", "));
    setCsvHint(`Loaded ${fromCsv.length} topic(s) from CSV (merged with the field above, max ${MAX_FULL_ARTICLE_TOPICS_PER_REQUEST}).`);
  }

  async function runBatch() {
    const token = session?.access_token;
    if (!token) return;
    const topics = mergeTopicLists(topicList, []);
    if (topics.length === 0) {
      setGenError("Add at least one topic (comma-separated or CSV).");
      return;
    }

    setGenError(null);
    setRunning(true);
    setDoneStages([]);
    setStage(null);
    setLogLines([]);
    setArticle("");
    setBatchTotal(topics.length > 1 ? topics.length : 0);
    setBatchIndex(0);

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const batchErrs: string[] = [];

    try {
      for (let i = 0; i < topics.length; i++) {
        const topicText = topics[i];
        setBatchIndex(i + 1);
        setDoneStages([]);
        setStage(null);
        setArticle("");
        pushLog(`[${i + 1}/${topics.length}] ${topicText}`);

        const pk =
          topicText.trim().split("\n")[0]?.trim() ||
          topicText.trim() ||
          "keyword";

        const result = await runArticlePipeline(
          {
            topic: topicText,
            audience,
            intent: "informational",
            sourceUrl: "",
            primaryKeyword: pk,
            searchConsoleQueries: [],
            googleSuggestions: [],
          },
          {
            onStage: setStage,
            onDoneStage: markDone,
            onLog: pushLog,
            onKeywords: () => {},
            onSources: () => {},
            onPaas: () => {},
            onFeaturedSnippet: () => {},
            onArticleDelta: (delta) => setArticle((prev) => prev + delta),
            onMeta: () => {},
            onResearchTopic: () => {},
            onResearchContext: () => {},
          },
        );

        if (!result.article.trim()) {
          batchErrs.push(`${topicText}: empty article`);
          continue;
        }

        const firstLine =
          topicText.trim().split("\n")[0]?.trim() || topicText.trim() || "Article";
        const title = result.meta?.metaTitle?.trim() || firstLine;
        const topicLabel = topicText.trim().slice(0, 500);

        const saveRes = await fetch("/api/user-articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            markdown: result.article,
            topic: topicLabel,
            primaryKeyword: pk,
            title: title.slice(0, 180),
          }),
        });
        const saveData = (await saveRes.json()) as { error?: string; id?: string };
        if (!saveRes.ok) {
          batchErrs.push(
            `${topicText}: ${saveData.error || `save failed (${saveRes.status})`}`,
          );
          continue;
        }
        pushLog(`Saved to automated articles: ${title.slice(0, 60)}…`);
        await refreshList(token);
        if (saveData.id) {
          setActiveTab(saveData.id);
        }
      }
      if (batchErrs.length > 0) {
        setGenError(
          `Finished with ${batchErrs.length} issue(s):\n${batchErrs.join("\n")}`,
        );
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Pipeline failed.");
    } finally {
      setRunning(false);
      setStage(null);
      setBatchIndex(0);
      setBatchTotal(0);
    }
  }

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <p className="font-mono text-sm text-text-muted">Checking session…</p>
      </main>
    );
  }

  if (!session?.access_token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 md:px-6">
        <h1 className="font-display text-2xl text-text-primary">
          Sign in required
        </h1>
        <p className="mt-3 font-serif text-sm text-text-secondary">
          Bulk article generation saves to your{" "}
          <strong className="text-text-primary">automated articles</strong>{" "}
          history (same as the SEO agent). Sign in from the SEO agent, then return
          here.
        </p>
        <Link
          href="/seo-agent"
          className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-background hover:opacity-90"
        >
          Open SEO Agent to sign in
        </Link>
      </main>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "generate", label: "Bulk generate" },
    ...items.map((it) => ({
      key: it.id,
      label:
        it.title.length > 28 ? `${it.title.slice(0, 28)}…` : it.title,
    })),
  ];

  return (
    <main className="mx-auto min-w-0 max-w-6xl px-4 py-8 sm:py-10 md:px-6">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Automated articles
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">
          Bulk article creating agent
        </h1>
        <p className="mt-2 max-w-2xl font-serif text-sm text-text-secondary">
          Same SEO pipeline as{" "}
          <Link href="/create-blog" className="text-accent hover:underline">
            blog create
          </Link>
          , but each draft is saved to your account as a generated article (not the
          public blog). Use comma-separated topics or upload a CSV with a{" "}
          <code className="rounded bg-background/60 px-1 font-mono text-[11px]">
            topic
          </code>{" "}
          column.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/seo-agent"
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent"
          >
            SEO Agent
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {listLoading ? (
        <p className="mt-6 font-mono text-xs text-text-muted">Loading your articles…</p>
      ) : null}
      {listError ? (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-serif text-sm text-amber-100">
          {listError}
        </p>
      ) : null}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 rounded-t-lg border border-b-0 px-3 py-2 font-mono text-[11px] transition-colors ${
              activeTab === t.key
                ? "border-border bg-surface/60 text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "generate" ? (
        <section className="mt-6 space-y-6 rounded-xl border border-border bg-surface/40 p-4 sm:p-6">
          <label className="block space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Topics (comma-separated, max {MAX_FULL_ARTICLE_TOPICS_PER_REQUEST})
            </span>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Topic one, topic two, topic three"
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              disabled={running}
            />
          </label>
          <p className="font-mono text-[11px] text-text-muted">
            Parsed topics: {topicList.length}
          </p>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Or upload CSV
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={running}
              onChange={(e) => void onCsvFile(e.target.files?.[0] ?? null)}
              className="block w-full max-w-md font-mono text-xs text-text-secondary file:mr-3 file:rounded file:border-0 file:bg-accent/20 file:px-2 file:py-1 file:font-mono file:text-xs file:text-accent"
            />
            {csvHint ? (
              <p className="font-serif text-xs text-text-secondary">{csvHint}</p>
            ) : null}
          </div>

          <label className="block space-y-2">
            <span className="font-mono text-xs uppercase text-text-muted">
              Audience (optional)
            </span>
            <textarea
              className="min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={running}
            />
          </label>

          {genError ? (
            <p className="rounded-lg border border-rose-400/50 bg-rose-500/10 px-3 py-2 font-serif text-sm text-rose-100">
              {genError}
            </p>
          ) : null}

          {running && batchTotal > 1 ? (
            <p className="font-mono text-xs text-accent">
              Generating {batchIndex}/{batchTotal}…
            </p>
          ) : null}
          <BulkTopicRunProgress
            current={batchIndex}
            total={batchTotal}
            active={running && batchTotal > 1}
          />

          <button
            type="button"
            disabled={running || topicList.length === 0}
            onClick={() => void runBatch()}
            className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background disabled:opacity-40"
          >
            {running
              ? batchTotal > 1
                ? `Running ${batchIndex}/${batchTotal}…`
                : "Running pipeline…"
              : topicList.length > 1
                ? `Run batch (${topicList.length})`
                : "Run pipeline & save"}
          </button>

          {(running || logLines.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <aside className="lg:sticky lg:top-24">
                <PipelineProgress
                  stages={PIPELINE_STAGES}
                  currentStage={stage}
                  doneStages={doneStages}
                />
              </aside>
              <div>
                <h2 className="font-display text-sm text-text-primary">Log</h2>
                <LiveLog lines={logLines} />
              </div>
            </div>
          )}

          {(running || article.length > 0) && (
            <div>
              <h2 className="font-display text-sm text-text-primary">
                {running ? "Draft (streaming)" : "Last draft preview"}
              </h2>
              <div className="custom-scrollbar mt-2 max-h-[min(50vh,28rem)] overflow-y-auto rounded-xl border border-border bg-surface/60 p-3">
                <ArticleRenderer markdown={article} streaming={running} />
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6 rounded-xl border border-border bg-surface/40 p-4 sm:p-6">
          {detailLoading ? (
            <p className="font-mono text-sm text-text-muted">Loading article…</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl text-text-primary">
                  {detail.title}
                </h2>
                <Link
                  href={`/dashboard/articles/${encodeURIComponent(detail.id)}`}
                  className="font-mono text-xs text-accent hover:underline"
                >
                  Open in dashboard →
                </Link>
              </div>
              <p className="font-mono text-[11px] text-text-muted">
                Topic: {detail.topic}
              </p>
              <div className="max-h-[min(60vh,36rem)] overflow-y-auto rounded-lg border border-border bg-background/40 p-3">
                <ArticleRenderer markdown={detail.markdown} />
              </div>
            </div>
          ) : (
            <p className="font-serif text-sm text-text-muted">
              Could not load this article.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
