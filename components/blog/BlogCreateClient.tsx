"use client";

import type { BlogPost } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { ArticleSeoScorecard } from "@/components/ArticleSeoScorecard";
import { LiveLog } from "@/components/LiveLog";
import { PipelineProgress } from "@/components/PipelineProgress";
import { runArticlePipeline } from "@/lib/article-pipeline";
import { computeArticleSeoScore } from "@/lib/article-seo-score";
import { slugify } from "@/lib/blog-slug";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import type { Keyword, SeoMeta } from "@/lib/types";

type Props = {
  initialPosts: BlogPost[];
  /** Set when server-side DB load failed (avoids a 500 on /blog-create). */
  loadError?: string | null;
};

const DEFAULT_AUDIENCE =
  "Typical Indian English readers interested in clear, practical English.";

export function BlogCreateClient({ initialPosts, loadError }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [doneStages, setDoneStages] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [article, setArticle] = useState("");
  const [meta, setMeta] = useState<SeoMeta | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  const [pubTitle, setPubTitle] = useState("");
  const [pubSlug, setPubSlug] = useState("");
  const [pubExcerpt, setPubExcerpt] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Blocks double-submit before React re-renders `saving`. */
  const publishInFlight = useRef(false);

  const topicFirstLine = topic.trim().split("\n")[0]?.trim() ?? "";
  const primaryKeyword = topicFirstLine;

  const seoScoreResult = useMemo(
    () =>
      computeArticleSeoScore(article, meta, keywords, {
        primaryKeyword,
        topicFirstLine,
      }),
    [article, meta, keywords, primaryKeyword, topicFirstLine],
  );

  const pushLog = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLogLines((prev) => [...prev, line]);
  }, []);

  const runGenerator = useCallback(async () => {
    if (!topic.trim() || running) return;
    setGenError(null);
    setRunning(true);
    setDoneStages([]);
    setStage(null);
    setLogLines([]);
    setArticle("");
    setMeta(null);
    setKeywords([]);
    setPubTitle("");
    setPubSlug("");
    setPubExcerpt("");

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    try {
      const result = await runArticlePipeline(
        {
          topic,
          audience,
          intent: "informational",
          sourceUrl: "",
          primaryKeyword,
          searchConsoleQueries: [],
          googleSuggestions: [],
        },
        {
          onStage: setStage,
          onDoneStage: markDone,
          onLog: pushLog,
          onKeywords: setKeywords,
          onSources: () => {},
          onPaas: () => {},
          onFeaturedSnippet: () => {},
          onArticleDelta: (delta) => setArticle((prev) => prev + delta),
          onMeta: setMeta,
          onResearchTopic: () => {},
          onResearchContext: () => {},
        },
      );

      const m = result.meta;
      const firstLine = topic.trim().split("\n")[0]?.trim() || "Post";
      if (m) {
        setPubTitle(m.metaTitle || firstLine);
        setPubExcerpt(m.metaDescription || "");
        setPubSlug(slugify(m.urlSlug || m.metaTitle || firstLine));
      } else {
        setPubTitle(firstLine);
        setPubExcerpt("");
        setPubSlug(slugify(firstLine));
      }

      if (!result.article.trim()) {
        setGenError(
          "Article generation produced no text. Check API keys and try again.",
        );
      }
    } catch (e) {
      setGenError(
        e instanceof Error ? e.message : "Article pipeline failed unexpectedly.",
      );
    } finally {
      setRunning(false);
      setStage(null);
    }
  }, [topic, audience, primaryKeyword, running, pushLog]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!article.trim() || !pubTitle.trim()) return;
    if (publishInFlight.current || saving) return;
    publishInFlight.current = true;
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pubTitle.trim(),
          slug: pubSlug.trim() || undefined,
          excerpt: pubExcerpt.trim() || undefined,
          content: article,
          published,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      router.refresh();
      setTopic("");
      setArticle("");
      setMeta(null);
      setKeywords([]);
      setPubTitle("");
      setPubSlug("");
      setPubExcerpt("");
      setDoneStages([]);
      setLogLines([]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      publishInFlight.current = false;
      setSaving(false);
    }
  }

  const showPublish = !running && article.trim().length >= 10;

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-10 px-4 py-8 sm:py-10 md:px-6">
      {loadError ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
        >
          {loadError}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Blog CMS · Article generator
          </p>
          <h1 className="font-display text-3xl text-text-primary">
            Create a blog post
          </h1>
          <p className="mt-2 max-w-2xl font-serif text-sm text-text-secondary">
            Enter a topic and run the same pipeline as the SEO article tool
            (keywords, research, SERP, outline, streaming article, SEO audit).
            Then publish to the blog.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Link
            href="/blogs"
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
          >
            View blog
          </Link>
          <Link
            href="/seo-agent"
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-muted hover:text-accent"
          >
            Full article tool
          </Link>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/blogs" })}
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-muted hover:bg-background/80"
          >
            Sign out
          </button>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface/40 p-4 sm:p-6">
        <h2 className="font-display text-lg text-text-primary">1. Topic</h2>
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Topic / brief (required)
          </span>
          <textarea
            className="custom-scrollbar min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="e.g. Best MBA colleges in India for working professionals"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={running}
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Audience (optional, passed to the generator)
          </span>
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={running}
          />
        </label>
        {genError && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-200">
            {genError}
          </p>
        )}
        <button
          type="button"
          onClick={() => void runGenerator()}
          disabled={running || !topic.trim()}
          className="w-full rounded-lg bg-accent px-6 py-2.5 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {running ? "Generating article…" : "Run full article pipeline"}
        </button>
      </section>

      {(running || logLines.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <PipelineProgress
              stages={PIPELINE_STAGES}
              currentStage={stage}
              doneStages={doneStages}
            />
          </aside>
          <div className="space-y-4">
            <h2 className="font-display text-lg text-text-primary">Live log</h2>
            <LiveLog lines={logLines} />
          </div>
        </div>
      )}

      {(running || article) && (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-text-primary">
            {running ? "Draft (streaming)" : "Draft preview"}
          </h2>
          <div className="custom-scrollbar max-h-[min(55vh,32rem)] overflow-y-auto rounded-xl border border-border bg-surface/60 p-3 sm:p-4">
            <ArticleRenderer markdown={article} streaming={running} />
          </div>
        </section>
      )}

      {showPublish && (
        <>
          <ArticleSeoScorecard result={seoScoreResult} compact />
          <section className="space-y-4 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-6">
            <h2 className="font-display text-lg text-text-primary">
              2. Publish to blog
            </h2>
            <p className="font-serif text-sm text-text-secondary">
              Titles and excerpt are filled from the SEO audit when available.
              Edit before publishing.
            </p>
            <form onSubmit={(e) => void onPublish(e)} className="space-y-4">
              <label className="block space-y-2">
                <span className="font-mono text-xs uppercase text-text-muted">
                  Post title
                </span>
                <input
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                />
              </label>
              <label className="block space-y-2">
                <span className="font-mono text-xs uppercase text-text-muted">
                  URL slug
                </span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  value={pubSlug}
                  onChange={(e) => setPubSlug(e.target.value)}
                  placeholder="auto-from-title"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-mono text-xs uppercase text-text-muted">
                  Excerpt (listing)
                </span>
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  value={pubExcerpt}
                  onChange={(e) => setPubExcerpt(e.target.value)}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3 font-mono text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-border"
                />
                Published (visible on /blogs)
              </label>
              {saveError && (
                <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-200">
                  {saveError}
                </p>
              )}
              <button
                type="submit"
                disabled={saving || !article.trim()}
                className="w-full rounded-lg bg-accent px-6 py-2.5 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 disabled:opacity-40 sm:w-auto"
              >
                {saving ? "Publishing…" : "Publish blog post"}
              </button>
            </form>
          </section>
        </>
      )}

      <section className="border-t border-border pt-8">
        <h2 className="font-display text-xl text-text-primary">Your posts</h2>
        <ul className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <li className="font-serif text-sm text-text-muted">No posts yet.</li>
          ) : (
            posts.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface/60 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-text-primary">{p.title}</span>
                    {!p.published && (
                      <span className="rounded border border-amber-500/40 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                        draft
                      </span>
                    )}
                  </div>
                  <span className="mt-1 block font-mono text-[11px] text-text-muted break-all">
                    /blogs/{p.slug}
                  </span>
                </div>
                {p.published && (
                  <Link
                    href={`/blogs/${p.slug}`}
                    className="shrink-0 font-mono text-xs text-accent hover:underline sm:self-center"
                  >
                    View →
                  </Link>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
