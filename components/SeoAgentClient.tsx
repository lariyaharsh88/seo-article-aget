"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
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
  const [authReady, setAuthReady] = useState(false);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileHint, setProfileHint] = useState<string | null>(null);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);
  const [historyLink, setHistoryLink] = useState<string | null>(null);
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

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      void supabase.auth.getSession().then(({ data }) => {
        setUserSession(data.session ?? null);
        setAuthReady(true);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserSession(session);
        setAuthReady(true);
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    const uid = userSession?.user?.id?.trim();
    const email = userSession?.user?.email ?? "";
    const token = userSession?.access_token;
    if (!uid) {
      setDisplayName("");
      setProfileLoading(false);
      setProfileHint(null);
      return;
    }
    if (!token) {
      const stored = localStorage.getItem(`rfh:name:${uid}`) || "";
      setDisplayName(stored || email.split("@")[0] || "");
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileHint(null);
    void (async () => {
      try {
        const res = await fetch("/api/user-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: unknown = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : `HTTP ${res.status}`;
          setProfileHint(msg);
          const stored = localStorage.getItem(`rfh:name:${uid}`) || "";
          setDisplayName(stored || email.split("@")[0] || "");
          return;
        }
        const profile =
          isRecord(data) && isRecord(data.profile) ? data.profile : null;
        const dn =
          profile && typeof profile.displayName === "string"
            ? profile.displayName.trim()
            : "";
        if (dn) {
          setDisplayName(dn);
          localStorage.setItem(`rfh:name:${uid}`, dn);
        } else {
          const stored = localStorage.getItem(`rfh:name:${uid}`) || "";
          setDisplayName(stored || email.split("@")[0] || "");
        }
      } catch {
        if (!cancelled) {
          const stored = localStorage.getItem(`rfh:name:${uid}`) || "";
          setDisplayName(stored || email.split("@")[0] || "");
          setProfileHint("Could not load profile from server.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userSession?.user?.id, userSession?.user?.email, userSession?.access_token]);
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
    setHistoryNotice(null);
    setHistoryLink(null);
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
      if (userSession?.access_token && result.article.trim().length > 80) {
        try {
          const saveRes = await fetch("/api/user-articles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userSession.access_token}`,
            },
            body: JSON.stringify({
              markdown: result.article,
              topic: effectiveInput.topic,
              primaryKeyword: effectiveInput.primaryKeyword,
              sourceUrl: effectiveInput.sourceUrl,
              title: topicFirstLine || effectiveInput.primaryKeyword || "Generated article",
            }),
          });
          const saveData = (await saveRes.json()) as {
            dashboardLink?: string;
            error?: string;
          };
          if (saveRes.ok && saveData.dashboardLink) {
            setHistoryLink(saveData.dashboardLink);
            setHistoryNotice("Saved to your dashboard history.");
          } else if (saveData.error) {
            setHistoryNotice(`History save skipped: ${saveData.error}`);
          }
        } catch {
          setHistoryNotice("History save skipped due to network issue.");
        }
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
  }, [
    mode,
    simpleKeyword,
    input,
    pushLog,
    gscRows,
    gscNote,
    googleSuggestions,
    autoEnrich,
    userSession?.access_token,
    topicFirstLine,
  ]);

  const runWithAuth = useCallback(async () => {
    if (!userSession) {
      setLoginPromptOpen(true);
      setAuthError(null);
      setAuthNotice("Login required before generating an article.");
      return;
    }
    await runPipeline();
  }, [runPipeline, userSession]);

  const sendAuthMagicLink = useCallback(async () => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent("/seo-agent")}`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setAuthNotice("Magic link sent. Open your email, then come back and click Generate.");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Could not send magic link.");
    } finally {
      setAuthLoading(false);
    }
  }, [authEmail]);

  const savePersonalization = useCallback(async () => {
    const uid = userSession?.user?.id?.trim();
    const token = userSession?.access_token;
    if (!uid) return;
    setProfileHint(null);
    if (!token) {
      localStorage.setItem(`rfh:name:${uid}`, displayName.trim());
      setProfileHint("Saved locally (sign in to sync to your account).");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `HTTP ${res.status}`;
        setProfileHint(msg);
        return;
      }
      localStorage.setItem(`rfh:name:${uid}`, displayName.trim());
      setProfileHint("Saved to your account.");
    } catch (e) {
      setProfileHint(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingProfile(false);
    }
  }, [displayName, userSession?.user?.id, userSession?.access_token]);

  const signOutUser = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      setLoginPromptOpen(false);
    } catch {
      /* ignore signout UI failures */
    }
  }, []);

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
          RankFlowHQ SEO Suite
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
              {authReady
                ? userSession?.user?.email
                  ? `Logged in as ${userSession.user.email}`
                  : "Login required before Generate Article."
                : "Checking login status..."}
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
            Guided workflow
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
              onClick={() => void runWithAuth()}
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
            <Link
              href="/login?next=/seo-agent"
              className="font-mono text-[11px] text-accent underline-offset-2 hover:underline sm:text-xs"
            >
              Open login page
            </Link>
            <Link
              href="/dashboard"
              className="font-mono text-[11px] text-accent underline-offset-2 hover:underline sm:text-xs"
            >
              Open dashboard
            </Link>
          </div>
          {historyNotice ? (
            <p className="font-mono text-[11px] text-text-muted">
              {historyNotice}{" "}
              {historyLink ? (
                <Link href={historyLink} className="text-accent underline-offset-2 hover:underline">
                  View entry
                </Link>
              ) : null}
            </p>
          ) : null}
          {userSession?.user?.id ? (
            <div className="rounded-xl border border-border bg-surface/60 p-3">
              <p className="font-mono text-xs text-text-secondary">
                Personalization: display name is stored in your account (database)
                when you save.
              </p>
              {profileLoading ? (
                <p className="mt-2 font-mono text-[11px] text-text-muted">
                  Loading profile…
                </p>
              ) : null}
              {profileHint ? (
                <p className="mt-2 font-mono text-[11px] text-text-muted">
                  {profileHint}
                </p>
              ) : null}
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  disabled={profileLoading}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:max-w-xs"
                />
                <button
                  type="button"
                  onClick={() => void savePersonalization()}
                  disabled={savingProfile || profileLoading}
                  className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  {savingProfile ? "Saving…" : "Save name"}
                </button>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}

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
                  {article.trim() ? (
                    <div className="mt-6 rounded-xl border border-border bg-surface/70 p-4">
                      <h3 className="font-display text-2xl text-text-primary">
                        Generative Engine Optimization panel
                      </h3>
                      <p className="mt-1 font-serif text-sm text-text-secondary">
                        AI Answer Score, ChatGPT snippet preview, and optimization suggestions for this draft.
                      </p>
                      <div className="mt-4">
                        <ArticleGeoPanel
                          article={article}
                          topic={topicFirstLine || input.topic.trim() || "this topic"}
                          primaryKeyword={input.primaryKeyword}
                        />
                      </div>
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
      {loginPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
            <h2 className="font-display text-2xl text-text-primary">Authorize first</h2>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              To prevent abuse, Generate Article requires login. Use email OTP magic
              link and then continue.
            </p>
            <label className="mt-4 block space-y-2">
              <span className="font-mono text-xs uppercase text-text-muted">Email</span>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            {authNotice ? (
              <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-200">
                {authNotice}
              </p>
            ) : null}
            {authError ? (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-200">
                {authError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void sendAuthMagicLink()}
                disabled={authLoading || !authEmail.trim()}
                className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background disabled:opacity-40"
              >
                {authLoading ? "Sending..." : "Send Magic Link"}
              </button>
              <button
                type="button"
                onClick={() => setLoginPromptOpen(false)}
                className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
              >
                Close
              </button>
              <Link
                href="/login?next=/seo-agent"
                className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
              >
                Full login page
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
