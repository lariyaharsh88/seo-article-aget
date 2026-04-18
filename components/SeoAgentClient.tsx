"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { ContentScoreStrip } from "@/components/workflow/ContentScoreStrip";
import { SeoPublishChecklist } from "@/components/workflow/SeoPublishChecklist";
import { WorkflowStepper } from "@/components/workflow/WorkflowStepper";
import { ArticleCopyBar } from "@/components/ArticleCopyBar";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { PipelineProgress } from "@/components/PipelineProgress";
import { TopicForm } from "@/components/TopicForm";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { runArticlePipeline } from "@/lib/article-pipeline";
import { computeArticleSeoScore } from "@/lib/article-seo-score";
import { trackEvent, trackHeatmapTrigger } from "@/lib/analytics";
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
  | "article"
  | "score"
  | "geo"
  | "seo"
  | "keywords"
  | "sources"
  | "visual";

type PipelineMode = "simple" | "advanced";
type ArticleViewMode = "edit" | "preview";
const FREE_GUEST_RUN_LIMIT = 2;
const FREE_LOGGED_RUN_LIMIT = 5;
const WEEKLY_GOAL = 5;
const ONBOARDING_TOTAL_STEPS = 3;

type LocalHistoryEntry = {
  id: string;
  title: string;
  createdAt: string;
};

type OnboardingState = {
  role: "founder" | "marketer" | "agency" | "";
  objective: "traffic" | "leads" | "content-velocity" | "";
  cadence: "daily" | "weekly" | "twice-weekly" | "";
  starterKeyword: string;
};

function dayStamp(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function SeoAgentClient() {
  const searchParams = useSearchParams();
  const quickTryMode = searchParams.get("try") === "1";
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
          setProfileHint("We couldn't load your profile right now. Please try again.");
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
  const [, setLogLines] = useState<string[]>([]);
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
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [usageRuns, setUsageRuns] = useState(0);
  const [streakDays, setStreakDays] = useState(1);
  const [weeklyRuns, setWeeklyRuns] = useState(0);
  const [localHistory, setLocalHistory] = useState<LocalHistoryEntry[]>([]);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [pinnedKeyword, setPinnedKeyword] = useState("");
  const [showDidYouKnow, setShowDidYouKnow] = useState(true);
  const [didYouKnowIndex, setDidYouKnowIndex] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    role: "",
    objective: "",
    cadence: "",
    starterKeyword: "",
  });

  useEffect(() => {
    if (quickTryMode && !simpleKeyword.trim()) {
      setSimpleKeyword("best ai seo tools for startups");
      setMode("simple");
    }
  }, [quickTryMode, simpleKeyword]);

  useEffect(() => {
    const bucket = userSession?.user?.id?.trim() || "guest";
    const storedPinned = localStorage.getItem(`rfh:pinned-keyword:${bucket}`) || "";
    setPinnedKeyword(storedPinned);
    const dismissed = localStorage.getItem(`rfh:dismissed:did-you-know:${bucket}`) === "1";
    setShowDidYouKnow(!dismissed);
  }, [userSession?.user?.id]);

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
        const nextStreak = (streakRaw ? Number.parseInt(streakRaw, 10) || 1 : 1) + 1;
        setStreakDays(nextStreak);
        localStorage.setItem(`rfh:streak:days:${bucket}`, String(nextStreak));
      } else {
        setStreakDays(1);
        localStorage.setItem(`rfh:streak:days:${bucket}`, "1");
      }
      localStorage.setItem(`rfh:last-active:${bucket}`, today);
    }
  }, [userSession?.user?.id]);

  useEffect(() => {
    const bucket = userSession?.user?.id?.trim() || "guest";
    setOnboardingDone(
      localStorage.getItem(`rfh:onboarding:done:${bucket}`) === "1",
    );
  }, [userSession?.user?.id]);

  const usageLimit = userSession ? FREE_LOGGED_RUN_LIMIT : FREE_GUEST_RUN_LIMIT;
  const usageRemaining = Math.max(0, usageLimit - usageRuns);
  const usageLimitReached = usageRemaining <= 0;
  const hasFirstOutput = article.trim().length >= 40;
  const hasVisitedOptimizationStep =
    tab === "seo" || tab === "score" || (hasFirstOutput && !running);

  const onboardingProgress = Math.round(
    (onboardingStep / ONBOARDING_TOTAL_STEPS) * 100,
  );
  const onboardingChecklistItems = [
    { id: "setup", label: "Finish quick setup (optional)", done: onboardingDone },
    { id: "output", label: "Generate your first article", done: hasFirstOutput },
    {
      id: "optimize",
      label: "Open Meta & share or Score",
      done: hasVisitedOptimizationStep,
    },
  ] as const;
  const onboardingChecklistDone = onboardingChecklistItems.filter((item) => item.done).length;

  const skipOnboardingTour = useCallback(() => {
    const bucket = userSession?.user?.id?.trim() || "guest";
    localStorage.setItem(`rfh:onboarding:done:${bucket}`, "1");
    setOnboardingDone(true);
    setOnboardingOpen(false);
  }, [userSession?.user?.id]);

  const completeOnboarding = useCallback(() => {
    const bucket = userSession?.user?.id?.trim() || "guest";
    localStorage.setItem(`rfh:onboarding:done:${bucket}`, "1");
    setOnboardingDone(true);
    setOnboardingOpen(false);

    const audienceMap: Record<NonNullable<OnboardingState["role"]>, string> = {
      founder: "startup founders",
      marketer: "growth marketers",
      agency: "agency SEO teams",
      "": "",
    };
    const intentMap: Record<NonNullable<OnboardingState["objective"]>, PipelineInput["intent"]> = {
      traffic: "informational",
      leads: "commercial",
      "content-velocity": "transactional",
      "": "informational",
    };

    if (onboarding.starterKeyword.trim()) {
      setSimpleKeyword(onboarding.starterKeyword.trim());
    }
    setInput((prev) => ({
      ...prev,
      audience: onboarding.role ? audienceMap[onboarding.role] : prev.audience,
      intent: onboarding.objective ? intentMap[onboarding.objective] : prev.intent,
      primaryKeyword: onboarding.starterKeyword.trim() || prev.primaryKeyword,
      topic:
        onboarding.starterKeyword.trim() && !prev.topic.trim()
          ? onboarding.starterKeyword.trim()
          : prev.topic,
    }));

    setHistoryNotice(
      'Setup saved. Press "Generate article" below when you are ready.',
    );
    trackEvent("onboarding_complete", {
      role: onboarding.role || "unknown",
      objective: onboarding.objective || "unknown",
      cadence: onboarding.cadence || "unknown",
    });
  }, [onboarding, userSession?.user?.id]);

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

  const articleWorkflowComplete = article.trim().length >= 80;
  const publishWorkflowComplete = Boolean(
    meta?.metaTitle?.trim() && meta?.metaDescription?.trim(),
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
          setHistoryNotice(`We couldn't save this to history: ${saveData.error}`);
          }
        } catch {
          setHistoryNotice("We couldn't save to history due to a network issue. Please try again.");
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
        title: topicFirstLine || effectiveInput.primaryKeyword || "Generated article",
        createdAt: new Date().toISOString(),
      };
      const nextHistory = [newEntry, ...localHistory].slice(0, 8);
      setLocalHistory(nextHistory);
      localStorage.setItem(`rfh:history:list:${bucket}`, JSON.stringify(nextHistory));
      setArticleEditorEpoch((n) => n + 1);
      const keywordLabel = effectiveInput.primaryKeyword.trim() || "your keyword";
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

  const runInstantDemo = useCallback(async () => {
    if (running) return;
    trackEvent("funnel_step", {
      funnel_name: "plg_try_without_signup",
      step_name: "instant_demo_started",
      step_order: 1,
    });
    trackHeatmapTrigger("instant_demo_started", { page_path: "/seo-agent" });
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
    setEnrichedHtml("");
    setHistoryNotice(null);
    setHistoryLink(null);
    setArticleViewMode("preview");
    setTab("article");

    const markDone = (id: string) => {
      setDoneStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    const steps = [
      "input-validation",
      "keyword-pipeline",
      "outline",
      "article",
      "seo-package",
    ];
    for (const s of steps) {
      setStage(s);
      pushLog(`Demo: ${s.replace("-", " ")}`);
      await new Promise((r) => setTimeout(r, 500));
      markDone(s);
    }

    const k = simpleKeyword.trim() || "seo content workflow";
    setArticle(
      `# ${k}: Quick Demo Draft\n\n` +
        `## Fast summary\nThis instant demo shows how a structured content workflow can improve ranking consistency and publishing speed.\n\n` +
        `## Key points\n- Clear keyword intent alignment\n- Better heading hierarchy for readability\n- Internal links for stronger topic authority\n\n` +
        `## Next step\nCreate a full draft with your own topic and audience settings.`,
    );
    setMeta({
      metaTitle: `${k} | SEO Guide`,
      metaDescription:
        "A quick demo showing how structured SEO workflows improve ranking consistency and user engagement.",
      urlSlug: k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      focusKeyword: k,
      secondaryKeywords: ["seo workflow", "content optimization"],
      schemaType: "Article",
      ogTitle: `${k} | SEO Guide`,
      twitterDescription:
        "Instant demo preview of a structured SEO workflow and publish-ready draft format.",
      readabilityGrade: "8th grade",
      estimatedWordCount: "750",
    });
    setHistoryNotice("Instant demo ready. Sign in to generate full production outputs.");
    setRewardNotice("Reward unlocked: instant demo is ready. Upgrade to run your full workflow.");
    window.setTimeout(() => setRewardNotice(null), 4500);
    trackEvent("funnel_step", {
      funnel_name: "plg_try_without_signup",
      step_name: "instant_demo_completed",
      step_order: 2,
    });
    setStage(null);
    setRunning(false);
  }, [pushLog, running, simpleKeyword]);

  const runWithAuth = useCallback(async () => {
    if (usageLimitReached) {
      setError("You've reached your free limit. Upgrade to Pro to keep generating without limits.");
      trackEvent("funnel_dropoff", {
        funnel_name: "upgrade_nudge",
        step_name: "usage_limit_blocked",
      });
      return;
    }
    if (!userSession && quickTryMode) {
      await runInstantDemo();
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
  }, [quickTryMode, runInstantDemo, runPipeline, usageLimitReached, userSession]);

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
      setAuthError(e instanceof Error ? e.message : "We couldn't send the magic link. Please try again.");
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
      setProfileHint(e instanceof Error ? e.message : "We couldn't save your changes. Please try again.");
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

  const copyInviteLink = useCallback(async () => {
    try {
      const token =
        inviteCode.trim() ||
        `rfh-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      if (!inviteCode.trim()) setInviteCode(token);
      const url = `${window.location.origin}/seo-agent?ref=${encodeURIComponent(token)}&try=1`;
      await navigator.clipboard.writeText(url);
      setInviteStatus("Invite link copied. Share it to unlock bonus templates.");
      trackEvent("referral_invite", {
        action: "invite_link_copied",
        invite_code: token,
      });
      trackHeatmapTrigger("invite_link_copied", { page_path: "/seo-agent" });
    } catch {
      setInviteStatus("We couldn't copy your invite link. Please try again.");
    }
  }, [inviteCode]);

  const claimInviteUnlock = useCallback(() => {
    setInviteCount((n) => {
      const next = n + 1;
      trackEvent("referral_invite", {
        action: "invite_tracked",
        invite_count: next,
      });
      return next;
    });
    setInviteStatus("Invite recorded. Your bonus unlock progress has been updated.");
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "article", label: "Article" },
    { id: "visual", label: "Rich HTML" },
    { id: "score", label: "Score" },
    { id: "geo", label: "AI answers" },
    { id: "seo", label: "Meta & share" },
    { id: "keywords", label: "Keywords" },
    { id: "sources", label: "Sources" },
  ];
  const didYouKnowItems = [
    "The Rich HTML tab has ready-to-paste blocks (images and tables) for your site.",
    "Meta & share has your page title and description—copy them into your CMS.",
    "Sharing exports can include a small “Powered by” line to help others find the tool.",
    "Save a keyword (in Shortcuts & extras) to reuse it on your next visit.",
  ] as const;
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
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
      return "Suggestion: check your internet connection, then try again.";
    }
    if (msg.includes("login") || msg.includes("auth")) {
      return "Suggestion: log in again and retry generation.";
    }
    return "Suggestion: try generating again. If this keeps happening, refresh the page.";
  }, [error]);

  const applyQuickKeyword = useCallback(
    (value: string) => {
      setMode("simple");
      setSimpleKeyword(value);
      setHistoryNotice(`Quick action applied: "${value}". Tap generate to get an instant result.`);
      trackEvent("feature_usage", {
        feature_name: "hook_model_quick_action",
        action: "apply_keyword",
        keyword: value,
      });
    },
    [],
  );

  const savePinnedKeyword = useCallback(() => {
    const value = simpleKeyword.trim();
    if (!value) {
      setHistoryNotice("Add a keyword first, then pin it for one-click return.");
      return;
    }
    const bucket = userSession?.user?.id?.trim() || "guest";
    localStorage.setItem(`rfh:pinned-keyword:${bucket}`, value);
    setPinnedKeyword(value);
    setHistoryNotice(`Investment saved: "${value}" pinned for your next session.`);
    trackEvent("feature_usage", {
      feature_name: "hook_model_investment",
      action: "pin_keyword",
    });
  }, [simpleKeyword, userSession?.user?.id]);

  const dismissDidYouKnow = useCallback(() => {
    const bucket = userSession?.user?.id?.trim() || "guest";
    localStorage.setItem(`rfh:dismissed:did-you-know:${bucket}`, "1");
    setShowDidYouKnow(false);
  }, [userSession?.user?.id]);

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
      <header className="space-y-4 border-b border-border pb-6 sm:pb-8">
        <div className="space-y-2">
          <h1 className="font-display text-2xl text-text-primary sm:text-3xl md:text-4xl">
            SEO article generator
          </h1>
          <p className="max-w-2xl text-base text-text-secondary">
            Type a keyword or topic, press generate, then copy your article and meta tags. Use{" "}
            <span className="font-medium text-text-primary">Quick Start</span> for the fastest path.
          </p>
          <p className="text-sm text-text-muted">
            {authReady
              ? userSession?.user?.email
                ? `Signed in as ${userSession.user.email}.`
                : quickTryMode
                  ? "You can try without an account."
                  : "You can try without signing in; sign in later to save work."
              : "Checking sign-in…"}
            {" "}
            <Link
              href="/repurpose-url"
              className="text-accent underline-offset-2 hover:underline"
            >
              Have a URL only? Turn it into an article here
            </Link>
            .
          </p>
        </div>

        {!onboardingDone && !onboardingOpen ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Optional: 30-second preferences to tailor your first draft.
            </p>
            <div className="flex flex-shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setOnboardingOpen(true);
                  setOnboardingStep(1);
                }}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
              >
                Short tour
              </button>
              <button
                type="button"
                onClick={() => skipOnboardingTour()}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
              >
                Skip — I’ll enter a keyword
              </button>
            </div>
          </div>
        ) : null}

        <div className="inline-flex rounded-lg border border-border bg-surface/70 p-1">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "simple"
                ? "bg-accent text-background"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Quick Start
          </button>
          <button
            type="button"
            onClick={() => setMode("advanced")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "advanced"
                ? "bg-accent text-background"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Advanced
          </button>
        </div>
        <WorkflowStepper
          keywordComplete={keywordBriefComplete}
          articleComplete={articleWorkflowComplete}
          publishComplete={publishWorkflowComplete}
        />
        <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background/40 px-3 py-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm text-text-secondary">
            Free runs left:{" "}
            <span className="font-semibold text-text-primary">
              {usageRemaining} / {usageLimit}
            </span>
            {usageLimitReached ? (
              <span className="text-red-300"> — limit reached</span>
            ) : null}
          </p>
          <div className="h-2 min-w-0 flex-1 rounded-full bg-background/80 sm:max-w-xs">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usageLimitReached ? "bg-red-400" : "bg-accent"
              }`}
              style={{
                width: `${Math.min(100, (usageRuns / usageLimit) * 100)}%`,
              }}
            />
          </div>
          <Link
            href="/pricing"
            className="text-sm font-medium text-accent hover:underline"
          >
            See plans
          </Link>
        </div>
      </header>

      {onboardingOpen ? (
        <section className="rounded-2xl border border-accent/40 bg-surface/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
              Quick setup guide ({onboardingStep}/{ONBOARDING_TOTAL_STEPS})
            </p>
            <button
              type="button"
              onClick={() => skipOnboardingTour()}
              className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-text-secondary hover:border-accent hover:text-accent"
            >
              Skip
            </button>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-background/70">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${onboardingProgress}%` }} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-muted">
            Step {onboardingStep}/{ONBOARDING_TOTAL_STEPS} - you are under 30 seconds away from your first &ldquo;aha&rdquo; moment.
          </p>

          {onboardingStep === 1 ? (
            <div className="mt-4 space-y-3">
              <p className="font-display text-lg text-text-primary">What best describes you?</p>
              <p className="font-serif text-sm text-text-secondary">
                We will personalize your first quick win.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: "founder", label: "Founder" },
                  { id: "marketer", label: "Marketer" },
                  { id: "agency", label: "Agency" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setOnboarding((prev) => ({ ...prev, role: item.id as OnboardingState["role"] }))
                    }
                    className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                      onboarding.role === item.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text-secondary hover:border-accent/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {onboardingStep === 2 ? (
            <div className="mt-4 space-y-3">
              <p className="font-display text-lg text-text-primary">Set your goal and publishing pace</p>
              <p className="font-serif text-sm text-text-secondary">
                Pick what success looks like this week.
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                Main goal
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: "traffic", label: "Grow traffic" },
                  { id: "leads", label: "Capture leads" },
                  { id: "content-velocity", label: "Publish faster" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setOnboarding((prev) => ({
                        ...prev,
                        objective: item.id as OnboardingState["objective"],
                      }))
                    }
                    className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                      onboarding.objective === item.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text-secondary hover:border-accent/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="pt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                Publishing pace
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: "daily", label: "Daily" },
                  { id: "twice-weekly", label: "Twice weekly" },
                  { id: "weekly", label: "Weekly" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setOnboarding((prev) => ({ ...prev, cadence: item.id as OnboardingState["cadence"] }))
                    }
                    className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                      onboarding.cadence === item.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text-secondary hover:border-accent/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {onboardingStep === 3 ? (
            <div className="mt-4 space-y-3">
              <p className="font-display text-lg text-text-primary">Pick one starter keyword</p>
              <p className="font-serif text-sm text-text-secondary">
                This powers your first result immediately.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  "ai seo tools for startups",
                  "how to improve seo traffic",
                  "best content workflow for saas",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setOnboarding((prev) => ({ ...prev, starterKeyword: item }))
                    }
                    className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                      onboarding.starterKeyword === item
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text-secondary hover:border-accent/60"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={onboarding.starterKeyword}
                onChange={(e) =>
                  setOnboarding((prev) => ({ ...prev, starterKeyword: e.target.value }))
                }
                placeholder="e.g. seo workflow for saas startup"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <p className="font-mono text-[11px] text-text-muted">
                Guided path: keep this keyword, then tap the highlighted generate button.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={() => setOnboardingStep((s) => Math.max(1, s - 1))}
              disabled={onboardingStep === 1}
              className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary disabled:opacity-40"
            >
              Back
            </button>
            {onboardingStep < ONBOARDING_TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() =>
                  setOnboardingStep((s) => Math.min(ONBOARDING_TOTAL_STEPS, s + 1))
                }
                className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={() => completeOnboarding()}
                className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
              >
                Finish & unlock my quick win
              </button>
            )}
          </div>
        </section>
      ) : null}

      {!onboardingOpen && onboardingChecklistDone < 3 ? (
        <section className="rounded-2xl border border-border/80 bg-surface/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
              Getting started
            </p>
            <span className="rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
              {onboardingChecklistDone}/3 complete
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-background/70">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${Math.round((onboardingChecklistDone / 3) * 100)}%` }}
            />
          </div>
          <ul className="mt-3 space-y-2">
            {onboardingChecklistItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/35 px-3 py-2"
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px] ${
                    item.done
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border text-text-muted"
                  }`}
                >
                  {item.done ? "✓" : "•"}
                </span>
                <span className="font-serif text-sm text-text-secondary">{item.label}</span>
              </li>
            ))}
          </ul>
          {onboardingChecklistDone < 3 ? (
            <p className="mt-3 text-sm text-text-muted">
              Optional checklist—skip anything you don&apos;t need. You can always use the tour in the header.
            </p>
          ) : (
            <p className="mt-3 text-sm text-accent">
              You&apos;ve covered setup, a draft, and SEO tools. Nice work.
            </p>
          )}
        </section>
      ) : null}

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

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_minmax(260px,300px)]">
        <div className="min-w-0 space-y-4">
          {quickTryMode && !userSession ? (
            <section className="rounded-xl border border-accent/40 bg-accent/10 p-3">
              <p className="text-sm font-medium text-text-primary">
                Demo mode — no account needed
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Add a keyword below and press generate. Keep this tab open while the article is created.
              </p>
            </section>
          ) : null}
          {mode === "simple" ? (
            <section
              className={`rounded-xl border bg-surface/80 p-4 ${
                onboardingOpen && onboardingStep === ONBOARDING_TOTAL_STEPS
                  ? "border-accent/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                  : "border-border"
              }`}
            >
              <h2 className="text-lg font-semibold text-text-primary">
                What should the article be about?
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                One keyword or short phrase is enough. Example: &ldquo;best CRM for small business&rdquo;.
              </p>
              <label className="mt-3 block text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Keyword or topic</span>
                <input
                  type="text"
                  value={simpleKeyword}
                  onChange={(e) => setSimpleKeyword(e.target.value)}
                  placeholder="e.g. ai tools for startup seo"
                  disabled={running}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              {onboardingOpen && onboardingStep === ONBOARDING_TOTAL_STEPS ? (
                <p className="mt-2 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] text-accent">
                  Ready—click &ldquo;Generate article&rdquo; below.
                </p>
              ) : null}
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
            {onboardingOpen && onboardingStep === ONBOARDING_TOTAL_STEPS ? (
              <p className="w-full rounded-md border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-[11px] text-accent">
                Click the green &ldquo;Generate article&rdquo; button below.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void runWithAuth()}
              disabled={!canRun || usageLimitReached}
              data-track-cta
              data-cta-label={quickTryMode && !userSession ? "run_instant_demo" : "run_pipeline"}
              className={`touch-manipulation w-full rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-all duration-200 enabled:hover:opacity-90 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${
                onboardingOpen && onboardingStep === ONBOARDING_TOTAL_STEPS
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                  : ""
              }`}
            >
              {running
                ? "Generating…"
                : !userSession && quickTryMode
                  ? "Generate article"
                : mode === "simple"
                  ? "Generate article"
                  : "Generate article"}
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
            <Link
              href="/login?next=/seo-agent"
              className="font-mono text-[11px] text-accent underline-offset-2 hover:underline sm:text-xs"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="font-mono text-[11px] text-accent underline-offset-2 hover:underline sm:text-xs"
            >
              View dashboard
            </Link>
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
                We&apos;re generating your output now. Keep this tab open for best results.
              </p>
            </div>
          ) : null}
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
          {rewardNotice ? (
            <div className="rounded-lg border border-success/45 bg-success/10 px-3 py-2">
              <p className="font-mono text-[11px] text-success">{rewardNotice}</p>
            </div>
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
          <div className="lg:hidden">
            <SeoPublishChecklist
              articleMarkdown={article}
              meta={meta}
              hasKeywordBrief={keywordBriefComplete}
              contentScore={showSeoScore ? seoScoreResult.overall : undefined}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3"
            >
              <p className="font-mono text-sm text-red-200">{error}</p>
              {errorGuidance ? (
                <p className="mt-1 font-mono text-[11px] text-red-100">{errorGuidance}</p>
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
              <p className="font-mono text-[11px] text-text-muted">{contextualFeatureHint}</p>
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
                    article.trim() ? (
                      <ArticleRenderer markdown={article} streaming={running} />
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
                        Export, share, or embed this output. Every share carries Powered by RankFlowHQ and can bring your next user.
                      </p>
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
            </div>
          </div>

          <details className="rounded-xl border border-border/80 bg-surface/50">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-text-primary">
              Shortcuts &amp; extras (invites, streak, keyword ideas)
            </summary>
            <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyQuickKeyword("ai seo tools for startups")}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  Try example keyword
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickKeyword("how to improve seo traffic")}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  Another example
                </button>
                <button
                  type="button"
                  onClick={() => setTab("seo")}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  Open Meta &amp; share
                </button>
                <button
                  type="button"
                  onClick={() => savePinnedKeyword()}
                  className="rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs text-accent hover:bg-accent/20"
                >
                  Save keyword for next time
                </button>
              </div>
              {pinnedKeyword ? (
                <p className="text-xs text-text-muted">
                  Saved keyword: &ldquo;{pinnedKeyword}&rdquo;
                </p>
              ) : null}
              {showDidYouKnow ? (
                <div className="rounded-lg border border-border/70 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-text-primary">Tip</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDidYouKnowIndex((i) => (i + 1) % didYouKnowItems.length)
                        }
                        className="text-xs text-accent hover:underline"
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissDidYouKnow()}
                        className="text-xs text-text-muted hover:text-text-secondary"
                      >
                        Hide tips
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    {didYouKnowItems[didYouKnowIndex]}
                  </p>
                </div>
              ) : null}
              <section className="rounded-xl border border-border bg-surface/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      Invite friends
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Share a link to unlock bonus templates when friends try the tool.
                    </p>
                  </div>
                  <div className="rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs text-accent">
                    Referrals: {inviteCount}/3
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background/80">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${Math.min(100, (inviteCount / 3) * 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Invite code (optional)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void copyInviteLink()}
                    data-track-cta
                    data-cta-label="copy_invite_link"
                    className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent transition-colors hover:bg-accent/20"
                  >
                    Copy invite link
                  </button>
                  <button
                    type="button"
                    onClick={() => claimInviteUnlock()}
                    data-track-cta
                    data-cta-label="track_invite_unlock"
                    className="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    I sent an invite
                  </button>
                </div>
                {inviteStatus ? (
                  <p className="mt-2 text-xs text-text-muted">{inviteStatus}</p>
                ) : (
                  <p className="mt-2 text-xs text-text-muted">
                    Progress: 1 invite = tier 1, 3 invites = full unlock.
                  </p>
                )}
              </section>
              <section className="rounded-xl border border-border/80 bg-surface/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    Pro (preview)
                  </p>
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                    Locked
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {[
                    "Bulk article generation queue",
                    "Team collaboration workspaces",
                    "Premium conversion templates",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-border/70 bg-background/40 px-3 py-2"
                    >
                      <p className="text-sm text-text-secondary blur-[0.8px]">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
                  >
                    View Pro
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-xs text-text-secondary hover:border-accent hover:text-accent"
                  >
                    Compare plans
                  </Link>
                </div>
              </section>
              <section className="rounded-xl border border-border/80 bg-surface/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    This week
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                      {streakDays} day streak
                    </span>
                    <span className="rounded-full border border-border/70 bg-background/50 px-2 py-0.5 text-[10px] text-text-secondary">
                      {weeklyRuns}/{WEEKLY_GOAL} runs
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background/80">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (weeklyRuns / WEEKLY_GOAL) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  {Math.max(0, WEEKLY_GOAL - weeklyRuns)} more run
                  {WEEKLY_GOAL - weeklyRuns === 1 ? "" : "s"} to hit your weekly goal.
                </p>
              </section>
              <section className="rounded-xl border border-border/80 bg-surface/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    Recent on this device
                  </p>
                  <Link
                    href="/dashboard"
                    className="text-xs text-accent underline-offset-2 hover:underline"
                  >
                    Full dashboard
                  </Link>
                </div>
                {localHistory.length ? (
                  <ul className="mt-3 space-y-2">
                    {localHistory.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-lg border border-border/70 bg-background/40 px-3 py-2"
                      >
                        <p className="text-sm text-text-secondary">{entry.title}</p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-text-muted">
                    Titles of articles you generate will show up here for quick reference.
                  </p>
                )}
              </section>
            </div>
          </details>
        </div>

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
      </div>
      {loginPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
            <h2 className="font-display text-2xl text-text-primary">Log in to continue</h2>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              To keep the workflow secure, please log in before generating. We&apos;ll send a magic link to your email.
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
