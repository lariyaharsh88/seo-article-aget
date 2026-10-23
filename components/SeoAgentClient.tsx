"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { ContentScoreStrip } from "@/components/workflow/ContentScoreStrip";
import { SeoPublishChecklist } from "@/components/workflow/SeoPublishChecklist";
import { ArticleCopyBar } from "@/components/ArticleCopyBar";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { PipelineProgress } from "@/components/PipelineProgress";
import { TopicForm } from "@/components/TopicForm";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { runArticlePipeline } from "@/lib/article-pipeline";
import { computeArticleSeoScore } from "@/lib/article-seo-score";
import { trackEvent } from "@/lib/analytics";
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
        Preparing editor...
      </p>
    ),
  },
);

const ResearchImagesPanel = dynamic(
  () =>
    import("@/components/ResearchImagesPanel").then((mod) => ({
      default: mod.ResearchImagesPanel,
    })),
  {
    ssr: false,
    loading: () => <PanelSkeleton lines={4} />,
  },
);

const KeywordsPanel = dynamic(
  () =>
    import("@/components/KeywordsPanel").then((mod) => ({
      default: mod.KeywordsPanel,
    })),
  {
    ssr: false,
    loading: () => <PanelSkeleton lines={5} />,
  },
);

const SeoPackage = dynamic(
  () =>
    import("@/components/SeoPackage").then((mod) => ({
      default: mod.SeoPackage,
    })),
  {
    ssr: false,
    loading: () => <PanelSkeleton lines={5} />,
  },
);

const SourcesList = dynamic(
  () =>
    import("@/components/SourcesList").then((mod) => ({
      default: mod.SourcesList,
    })),
  {
    ssr: false,
    loading: () => <PanelSkeleton lines={5} />,
  },
);

const ArticleSeoScorecard = dynamic(
  () =>
    import("@/components/ArticleSeoScorecard").then((mod) => ({
      default: mod.ArticleSeoScorecard,
    })),
  {
    ssr: false,
    loading: () => <PanelSkeleton lines={4} />,
  },
);

const ArticleGeoPanel = dynamic(
  () =>
    import("@/components/ArticleGeoPanel").then((mod) => ({
      default: mod.ArticleGeoPanel,
    })),
  {
    ssr: false,
    loading: () => <PanelSkeleton lines={4} />,
  },
);

function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-background/40 p-4">
      <div className="skeleton h-4 w-36 rounded-md" />
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={`s-${idx}`}
          className={`skeleton h-3.5 rounded-md ${idx === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

type TabId =
  "article" | "score" | "geo" | "seo" | "keywords" | "sources" | "visual";

type PipelineMode = "simple" | "advanced";
type ArticleViewMode = "edit" | "preview";
const FREE_GUEST_RUN_LIMIT = 2;
const FREE_LOGGED_RUN_LIMIT = 5;

type LocalHistoryEntry = {
  id: string;
  title: string;
  createdAt: string;
};

function dayStamp(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function SeoAgentClient() {
  const searchParams = useSearchParams();
  /** Homepage keyword box links here as /seo-agent?keyword=… */
  const keywordParam = searchParams.get("keyword")?.trim().slice(0, 200) ?? "";
  const [authReady, setAuthReady] = useState(false);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
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
  const [searchConsoleConfigured, setSearchConsoleConfigured] = useState(false);

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

  const [tab, setTab] = useState<TabId>("article");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [doneStages, setDoneStages] = useState<string[]>([]);
  const [, setLogLines] = useState<string[]>([]);
  const [article, setArticle] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [paas, setPaas] = useState<string[]>([]);
  const [featuredSnippet, setFeaturedSnippet] =
    useState<FeaturedSnippet | null>(null);
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
  const [articleViewMode, setArticleViewMode] =
    useState<ArticleViewMode>("edit");
  const [usageRuns, setUsageRuns] = useState(0);
  const [, setStreakDays] = useState(1);
  const [weeklyRuns, setWeeklyRuns] = useState(0);
  const [localHistory, setLocalHistory] = useState<LocalHistoryEntry[]>([]);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  useEffect(() => {
    if (keywordParam) {
      setSimpleKeyword(keywordParam);
      setMode("simple");
    }
  }, [keywordParam]);

  useEffect(() => {
    const bucket = userSession?.user?.id?.trim() || "guest";
    const raw = localStorage.getItem(`rfh:usage:runs:${bucket}`);
    setUsageRuns(raw ? Number.parseInt(raw, 10) || 0 : 0);
    const streakRaw = localStorage.getItem(`rfh:streak:days:${bucket}`);
    setStreakDays(streakRaw ? Number.parseInt(streakRaw, 10) || 1 : 1);
    const weeklyRaw = localStorage.getItem(`rfh:weekly:runs:${bucket}`);
    setWeeklyRuns(weeklyRaw ? Number.parseInt(weeklyRaw, 10) || 0 : 0);
    const historyRaw = localStorage.getItem(`rfh:history:list:${bucket}`);
    if (historyRaw) {
      try {
        const parsed = JSON.parse(historyRaw) as LocalHistoryEntry[];
        setLocalHistory(Array.isArray(parsed) ? parsed.slice(0, 8) : []);
      } catch {
        setLocalHistory([]);
      }
    } else {
      setLocalHistory([]);
    }

    const today = dayStamp(new Date());
    const lastActive = localStorage.getItem(`rfh:last-active:${bucket}`);
    if (!lastActive) {
      localStorage.setItem(`rfh:last-active:${bucket}`, today);
      return;
    }
    const prev = new Date(`${lastActive}T00:00:00Z`);
    const curr = new Date(`${today}T00:00:00Z`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays >= 1) {
      if (diffDays === 1) {
        const nextStreak =
          (streakRaw ? Number.parseInt(streakRaw, 10) || 1 : 1) + 1;
        setStreakDays(nextStreak);
        localStorage.setItem(`rfh:streak:days:${bucket}`, String(nextStreak));
      } else {
        setStreakDays(1);
        localStorage.setItem(`rfh:streak:days:${bucket}`, "1");
      }
      localStorage.setItem(`rfh:last-active:${bucket}`, today);
    }
  }, [userSession?.user?.id]);

  const usageLimit = userSession ? FREE_LOGGED_RUN_LIMIT : FREE_GUEST_RUN_LIMIT;
  const usageRemaining = Math.max(0, usageLimit - usageRuns);
  const usageLimitReached = usageRemaining <= 0;

  const canRun =
    mode === "simple"
      ? simpleKeyword.trim().length > 0 && !running
      : Boolean(input.topic.trim() || input.sourceUrl.trim()) && !running;

  const topicFirstLine = input.topic.trim().split("\n")[0]?.trim() ?? "";

  const seoScoreResult = useMemo(
    () =>
      computeArticleSeoScore(article, meta, keywords, {
        primaryKeyword: input.primaryKeyword,
        topicFirstLine,
      }),
    [article, meta, keywords, input.primaryKeyword, topicFirstLine],
  );

  const showSeoScore = article.trim().length >= 40 && !running;

  const keywordBriefComplete = useMemo(
    () =>
      mode === "simple"
        ? simpleKeyword.trim().length > 0
        : Boolean(
            input.topic.trim() ||
            input.primaryKeyword.trim() ||
            input.sourceUrl.trim(),
          ),
    [mode, simpleKeyword, input.topic, input.primaryKeyword, input.sourceUrl],
  );

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
      const details =
        isRecord(data) && Array.isArray(data.details) ? data.details : [];
      const rows: GscQueryRow[] = details
        .filter(
          (r): r is Record<string, unknown> =>
            typeof r === "object" && r !== null,
        )
        .map((r) => ({
          query: typeof r.query === "string" ? r.query : "",
          clicks: typeof r.clicks === "number" ? r.clicks : 0,
          impressions: typeof r.impressions === "number" ? r.impressions : 0,
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
      const res = await fetch(`/api/google-suggest?q=${encodeURIComponent(q)}`);
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

    if (!effectiveInput.topic.trim() && !effectiveInput.sourceUrl.trim())
      return;
    trackEvent("feature_usage", {
      feature_name: "seo_agent_pipeline",
      action: "start",
      mode,
    });
    trackEvent("funnel_step", {
      funnel_name: "seo_agent_generation",
      step_name: "generate_clicked",
      step_order: 1,
      mode,
    });
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
      hasSourceUrl && !gscFallbackToSiteWide ? gscRows.map((r) => r.query) : [];

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
      trackEvent("feature_usage", {
        feature_name: "seo_agent_pipeline",
        action: "complete",
        mode,
      });
      trackEvent("funnel_step", {
        funnel_name: "seo_agent_generation",
        step_name: "article_generated",
        step_order: 2,
        mode,
      });
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
              title:
                topicFirstLine ||
                effectiveInput.primaryKeyword ||
                "Generated article",
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
            setHistoryNotice(
              `We couldn't save this to history: ${saveData.error}`,
            );
          }
        } catch {
          setHistoryNotice(
            "We couldn't save to history due to a network issue. Please try again.",
          );
        }
      }
      const bucket = userSession?.user?.id?.trim() || "guest";
      const nextUsage = usageRuns + 1;
      setUsageRuns(nextUsage);
      localStorage.setItem(`rfh:usage:runs:${bucket}`, String(nextUsage));
      const nextWeekly = weeklyRuns + 1;
      setWeeklyRuns(nextWeekly);
      localStorage.setItem(`rfh:weekly:runs:${bucket}`, String(nextWeekly));
      const newEntry: LocalHistoryEntry = {
        id: `${Date.now()}`,
        title:
          topicFirstLine ||
          effectiveInput.primaryKeyword ||
          "Generated article",
        createdAt: new Date().toISOString(),
      };
      const nextHistory = [newEntry, ...localHistory].slice(0, 8);
      setLocalHistory(nextHistory);
      localStorage.setItem(
        `rfh:history:list:${bucket}`,
        JSON.stringify(nextHistory),
      );
      setArticleEditorEpoch((n) => n + 1);
      const keywordLabel =
        effectiveInput.primaryKeyword.trim() || "your keyword";
      setRewardNotice(
        `Reward unlocked: fresh output generated for "${keywordLabel}". Share it or optimize it in one click.`,
      );
      window.setTimeout(() => setRewardNotice(null), 5000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected pipeline error";
      setError(msg);
      pushLog(`Something went wrong: ${msg}`);
      trackEvent("funnel_dropoff", {
        funnel_name: "seo_agent_generation",
        step_name: "generation_error",
        mode,
      });
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
    weeklyRuns,
    localHistory,
    usageRuns,
    userSession?.access_token,
    userSession?.user?.id,
    topicFirstLine,
  ]);

  const runWithAuth = useCallback(async () => {
    if (usageLimitReached) {
      setError(
        "You've reached your free limit. Upgrade to Pro to keep generating without limits.",
      );
      trackEvent("funnel_dropoff", {
        funnel_name: "upgrade_nudge",
        step_name: "usage_limit_blocked",
      });
      return;
    }
    if (!userSession) {
      trackEvent("funnel_dropoff", {
        funnel_name: "seo_agent_generation",
        step_name: "auth_required_modal",
      });
      setLoginPromptOpen(true);
      setAuthError(null);
      setAuthNotice("Please log in to generate your article.");
      return;
    }
    await runPipeline();
  }, [runPipeline, usageLimitReached, userSession]);

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
      setAuthNotice(
        "Magic link sent. Open your email, then come back and click Generate.",
      );
    } catch (e) {
      setAuthError(
        e instanceof Error
          ? e.message
          : "We couldn't send the magic link. Please try again.",
      );
    } finally {
      setAuthLoading(false);
    }
  }, [authEmail]);



  /** Results UI (tabs, editor, progress) stays hidden until the first run, so new users see one task. */
  const hasStarted =
    running ||
    article.trim().length > 0 ||
    doneStages.length > 0 ||
    Boolean(error);

  const tabs: { id: TabId; label: string }[] = [
    { id: "article", label: "Article" },
    { id: "seo", label: "SEO title & meta" },
    { id: "score", label: "SEO score" },
    { id: "sources", label: "Sources" },
    { id: "keywords", label: "Keywords" },
    { id: "visual", label: "Formatted HTML" },
    { id: "geo", label: "AI search check" },
  ];
  const contextualFeatureHint = useMemo(() => {
    if (running) {
      return "Generation is running—keep this tab open. You can open Keywords or Sources in other tabs when text appears.";
    }
    if (!article.trim()) {
      return "After the run finishes, use Meta & share for title and description, or Rich HTML for your site.";
    }
    if (tab === "article") {
      return "Next: open Meta & share to copy the title and description for your CMS.";
    }
    if (tab === "seo") {
      return "Copy the blocks below into your site or social posts.";
    }
    if (tab === "visual") {
      return "Copy this HTML into your CMS if you use a custom HTML block.";
    }
    if (tab === "keywords") {
      return "Use these phrases for headings, FAQs, or internal links.";
    }
    return "Switch tabs to see scores, sources, and keyword ideas.";
  }, [article, running, tab]);
  const errorGuidance = useMemo(() => {
    if (!error) return null;
    const msg = error.toLowerCase();
    if (msg.includes("limit")) {
      return "Suggestion: open Pricing to upgrade, or come back after your next reset window.";
    }
    if (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed")
    ) {
      return "Suggestion: check your internet connection, then try again.";
    }
    if (msg.includes("login") || msg.includes("auth")) {
      return "Suggestion: log in again and retry generation.";
    }
    return "Suggestion: try generating again. If this keeps happening, refresh the page.";
  }, [error]);




  return (
    <main className={`mx-auto flex min-w-0 ${hasStarted ? "max-w-6xl" : "max-w-3xl"} flex-col gap-6 px-4 py-8 sm:gap-8 sm:py-10 md:px-6`}>
      <header className="space-y-4 border-b border-border pb-6 sm:pb-8">
        <div className="space-y-2">
          <h1 className="font-display text-2xl text-text-primary sm:text-3xl md:text-4xl">
            SEO article generator
          </h1>
          <p className="max-w-2xl text-base text-text-secondary">
            Turn one keyword into a researched, ready-to-publish article.
          </p>
        </div>

        <ol className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            [
              "1",
              "Enter a keyword",
              "The topic you want to rank for, e.g. “best CRM for small business”.",
            ],
            [
              "2",
              "We research and write",
              "We read the top Google results and write a long-form draft with sources. Takes about 2–4 minutes.",
            ],
            [
              "3",
              "Copy or publish",
              "Get the article plus SEO title and description. Copy it, download it, or save it to your dashboard.",
            ],
          ].map(([n, title, body]) => (
            <li
              key={n}
              className="rounded-xl border border-border/80 bg-surface/60 p-3 sm:p-4"
            >
              <p className="font-mono text-xs text-accent">Step {n}</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-text-primary sm:text-base">{title}</p>
              <p className="mt-1 hidden text-sm text-text-secondary sm:block">{body}</p>
            </li>
          ))}
        </ol>

        <p className="text-sm text-text-muted">
          {authReady
            ? userSession?.user?.email
              ? `Signed in as ${userSession.user.email} · ${usageRemaining} of ${usageLimit} free articles left.`
              : `A free account is needed to generate — your first ${FREE_LOGGED_RUN_LIMIT} articles are free, no card required.`
            : "Checking sign-in…"}{" "}
          <Link
            href="/repurpose-url"
            className="text-accent underline-offset-2 hover:underline"
          >
            Have a URL instead? Rewrite it into an article
          </Link>
          .
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

      <div
        className={`grid min-w-0 gap-6 ${hasStarted ? "lg:grid-cols-[1fr_minmax(260px,300px)]" : ""}`}
      >
        <div className="min-w-0 space-y-4">
          {mode === "simple" ? (
            <section className="rounded-xl border border-border bg-surface/80 p-4">
              <h2 className="text-lg font-semibold text-text-primary">
                What should the article be about?
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                One keyword or short phrase is enough. Example: &ldquo;best CRM
                for small business&rdquo;.
              </p>
              <label className="mt-3 block text-sm text-text-secondary">
                <span className="font-medium text-text-primary">
                  Keyword or topic
                </span>
                <input
                  type="text"
                  value={simpleKeyword}
                  onChange={(e) => setSimpleKeyword(e.target.value)}
                  placeholder="e.g. ai tools for startup seo"
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
              onFetchGoogleSuggestions={() =>
                void handleFetchGoogleSuggestions()
              }
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
              disabled={!canRun || usageLimitReached}
              data-track-cta
              data-cta-label="run_pipeline"
              className={`touch-manipulation w-full rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-all duration-200 enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto`}
            >
              {running
                ? "Generating… (about 2–4 min)"
                : userSession
                  ? "Generate article"
                  : "Sign in & generate"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "simple" ? "advanced" : "simple")}
              className="text-sm text-text-secondary underline-offset-2 hover:text-accent hover:underline"
            >
              {mode === "simple"
                ? "More options (audience, intent, source URL)"
                : "Use the simple form"}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary sm:text-sm">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                disabled={running}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Add images, charts, and tables (recommended)
            </label>
            <span className="text-xs text-text-muted sm:text-sm">
              Your topic is sent securely to generate the draft.
            </span>
            {usageLimitReached ? (
              <Link
                href="/pricing"
                className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-[11px] text-accent hover:bg-accent/20 sm:text-xs"
              >
                Upgrade to continue
              </Link>
            ) : null}
          </div>
          {running ? (
            <div className="rounded-lg border border-info/35 bg-info/10 px-3 py-2">
              <p className="font-mono text-[11px] text-info">
                We&apos;re generating your output now. Keep this tab open for
                best results.
              </p>
            </div>
          ) : null}
          {historyNotice ? (
            <p className="font-mono text-[11px] text-text-muted">
              {historyNotice}{" "}
              {historyLink ? (
                <Link
                  href={historyLink}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  View entry
                </Link>
              ) : null}
            </p>
          ) : null}
          {rewardNotice ? (
            <div className="rounded-lg border border-success/45 bg-success/10 px-3 py-2">
              <p className="font-mono text-[11px] text-success">
                {rewardNotice}
              </p>
            </div>
          ) : null}
          {hasStarted ? (
            <>
              <div className="lg:hidden">
                <PipelineProgress
                  stages={PIPELINE_STAGES}
                  currentStage={stage}
                  doneStages={doneStages}
                />
              </div>
              <div className="lg:hidden">
                <SeoPublishChecklist
                  articleMarkdown={article}
                  meta={meta}
                  hasKeywordBrief={keywordBriefComplete}
                  contentScore={
                    showSeoScore ? seoScoreResult.overall : undefined
                  }
                />
              </div>
            </>
          ) : null}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3"
            >
              <p className="font-mono text-sm text-red-200">{error}</p>
              {errorGuidance ? (
                <p className="mt-1 font-mono text-[11px] text-red-100">
                  {errorGuidance}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runWithAuth()}
                  disabled={running || !canRun || usageLimitReached}
                  className="rounded-md border border-red-300/40 bg-red-500/10 px-3 py-1.5 font-mono text-xs text-red-100 hover:bg-red-500/20 disabled:opacity-40"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {hasStarted ? (
            <div className="rounded-xl border border-border bg-surface/80 transition-all duration-200 ease-out">
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
                    onClick={() => {
                      setTab(t.id);
                      trackEvent("feature_usage", {
                        feature_name: "seo_agent_tabs",
                        action: "tab_open",
                        tab_id: t.id,
                      });
                    }}
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
              <ContentScoreStrip
                overall={seoScoreResult.overall}
                visible={Boolean(article.trim() && showSeoScore)}
                onViewDetails={() => setTab("score")}
                onOpenSeoPack={() => setTab("seo")}
              />
              <div className="border-b border-border/70 bg-background/30 px-3 py-2">
                <p className="font-mono text-[11px] text-text-muted">
                  {contextualFeatureHint}
                </p>
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
                      title={
                        topicFirstLine ||
                        input.primaryKeyword ||
                        "Generated article"
                      }
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
                      article.trim() ? (
                        <ArticleRenderer
                          markdown={article}
                          streaming={running}
                        />
                      ) : (
                        <PanelSkeleton lines={6} />
                      )
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
                      <div className="mt-4 rounded-xl border border-accent/35 bg-accent/10 p-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                          Growth loop
                        </p>
                        <p className="mt-1 font-serif text-sm text-text-secondary">
                          Export, share, or embed this output. Every share
                          carries Powered by RankFlowHQ and can bring your next
                          user.
                        </p>
                      </div>
                    ) : null}
                    {article.trim() ? (
                      <div className="mt-6 rounded-xl border border-border bg-surface/70 p-4">
                        <h3 className="font-display text-2xl text-text-primary">
                          Generative Engine Optimization panel
                        </h3>
                        <p className="mt-1 font-serif text-sm text-text-secondary">
                          AI Answer Score, ChatGPT snippet preview, and
                          optimization suggestions for this draft.
                        </p>
                        <div className="mt-4">
                          <ArticleGeoPanel
                            article={article}
                            topic={
                              topicFirstLine ||
                              input.topic.trim() ||
                              "this topic"
                            }
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
                      Add or generate article text first (about 40+ characters).
                      Scores use your markdown, the SEO package from the audit
                      stage when available, and your keyword list.
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
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 bg-surface/40 px-5 py-10 text-center">
              <p className="font-display text-lg text-text-primary">
                Your article will appear here
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                Enter a keyword above and press generate. You&apos;ll see each
                step as it happens, then the finished article with its SEO
                title, description and sources.
              </p>
            </div>
          )}
        </div>

        {hasStarted ? (
          <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:w-[280px] lg:shrink-0 lg:self-start">
            <PipelineProgress
              stages={PIPELINE_STAGES}
              currentStage={stage}
              doneStages={doneStages}
            />
            <SeoPublishChecklist
              articleMarkdown={article}
              meta={meta}
              hasKeywordBrief={keywordBriefComplete}
              contentScore={showSeoScore ? seoScoreResult.overall : undefined}
            />
          </aside>
        ) : null}
      </div>
      {loginPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
            <h2 className="font-display text-2xl text-text-primary">
              Log in to continue
            </h2>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              To keep the workflow secure, please log in before generating.
              We&apos;ll send a magic link to your email.
            </p>
            <label className="mt-4 block space-y-2">
              <span className="font-mono text-xs uppercase text-text-muted">
                Email
              </span>
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
                {authLoading ? "Sending..." : "Send magic link"}
              </button>
              <button
                type="button"
                onClick={() => setLoginPromptOpen(false)}
                className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
              >
                Not now
              </button>
              <Link
                href="/login?next=/seo-agent"
                className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
              >
                Open full login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
