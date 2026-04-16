/**
 * Shared SEO article pipeline (keywords → research → SERP → queries → outline → article stream → audit).
 * Used by /seo-agent and /blog-create.
 */

import { isKeywordRecord } from "@/lib/keyword-guards";
import { isSeoMeta } from "@/lib/seo-meta-guards";
import type {
  FeaturedSnippet,
  Keyword,
  PipelineInput,
  SeoMeta,
  Source,
} from "@/lib/types";

function buildHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFeaturedSnippet(v: unknown): v is FeaturedSnippet {
  if (typeof v !== "object" || v === null) return false;
  const o = v as FeaturedSnippet;
  return typeof o.text === "string" && o.text.trim().length > 0;
}

export type ArticlePipelineConfig = {
  topic: string;
  audience: string;
  intent: PipelineInput["intent"];
  sourceUrl: string;
  primaryKeyword: string;
  searchConsoleQueries: string[];
  googleSuggestions: string[];
};

export type ArticlePipelineCallbacks = {
  onStage: (stage: string | null) => void;
  onDoneStage: (id: string) => void;
  onLog: (message: string) => void;
  onKeywords: (keywords: Keyword[]) => void;
  onSources: (sources: Source[]) => void;
  onPaas: (paas: string[]) => void;
  onFeaturedSnippet: (f: FeaturedSnippet | null) => void;
  onArticleDelta: (delta: string) => void;
  onMeta: (meta: SeoMeta | null) => void;
  onResearchTopic: (topic: string) => void;
  onResearchContext: (context: string) => void;
  /** When set, runs POST /api/seo-enrich after audit (SEO agent visual publish HTML). */
  onEnrichedHtml?: (html: string) => void;
};

export type ArticlePipelineResult = {
  article: string;
  meta: SeoMeta | null;
  keywords: Keyword[];
  /** Populated when `onEnrichedHtml` was provided and enrichment succeeded. */
  enrichedHtml?: string | null;
};

/**
 * Runs the full article pipeline. Calls callbacks for UI updates; returns final article + meta.
 */
export async function runArticlePipeline(
  input: ArticlePipelineConfig,
  cbs: ArticlePipelineCallbacks,
): Promise<ArticlePipelineResult> {
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
  let meta: SeoMeta | null = null;

  const markDone = (id: string) => {
    cbs.onDoneStage(id);
  };

  const pushLog = (msg: string) => {
    cbs.onLog(msg);
  };

  let workingTopic = input.topic.trim();
  if (!workingTopic && input.sourceUrl.trim()) {
    pushLog("Brief: resolving title from URL…");
    try {
      const metaRes = await fetch(
        `/api/page-meta?url=${encodeURIComponent(input.sourceUrl.trim())}`,
      );
      const metaJson: unknown = await metaRes.json();
      if (
        metaRes.ok &&
        isRecord(metaJson) &&
        typeof metaJson.title === "string" &&
        metaJson.title.trim()
      ) {
        workingTopic = metaJson.title.trim();
      } else {
        workingTopic = input.sourceUrl.trim();
      }
    } catch {
      workingTopic = input.sourceUrl.trim();
    }
    pushLog(
      `Brief: using “${workingTopic.slice(0, 72)}${workingTopic.length > 72 ? "…" : ""}”.`,
    );
  }

  cbs.onStage("keywords");
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
        searchConsoleQueries: input.searchConsoleQueries,
        googleSuggestions: input.googleSuggestions,
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
    cbs.onKeywords(keywordList);
    markDone("keywords");
    pushLog(`Keywords: ${keywordList.length} items.`);
  } catch (e) {
    pushLog(`Keywords: degraded — ${e instanceof Error ? e.message : "error"}`);
  }

  cbs.onStage("research");
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
      researchContext = typeof data.context === "string" ? data.context : "";
      if (Array.isArray(data.results)) {
        sourcesList = data.results.filter(
          (s): s is Source =>
            typeof s === "object" &&
            s !== null &&
            typeof (s as Source).url === "string",
        );
      }
    }
    cbs.onSources(sourcesList);
    cbs.onResearchContext(researchContext);
    cbs.onResearchTopic(workingTopic);
    markDone("research");
    pushLog(`Research: ${sourcesList.length} unique sources.`);
  } catch (e) {
    pushLog(`Research: degraded — ${e instanceof Error ? e.message : "error"}`);
  }

  cbs.onStage("serp");
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
        paasList = data.paas.filter((p): p is string => typeof p === "string");
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
    cbs.onFeaturedSnippet(serpFeatured);
    cbs.onPaas(paasList);
    markDone("serp");
    pushLog(`SERP: ${paasList.length} PAA questions.`);
  } catch (e) {
    pushLog(`SERP: degraded — ${e instanceof Error ? e.message : "error"}`);
  }

  cbs.onStage("queries");
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
      queriesList = data.queries.filter((q): q is string => typeof q === "string");
    }
    markDone("queries");
    pushLog(`Queries: ${queriesList.length} clustered.`);
  } catch (e) {
    queriesList = [...relatedList, ...paasList].slice(0, 10);
    pushLog(`Queries: degraded — ${e instanceof Error ? e.message : "error"}`);
    markDone("queries");
  }

  cbs.onStage("outline");
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
      isRecord(data) && typeof data.outline === "string" ? data.outline : "";
    markDone("outline");
    pushLog("Outline: ready.");
  } catch (e) {
    outlineText = `# ${workingTopic}\n\n## Introduction\n### Hook\n### Scope\n`;
    pushLog(`Outline: degraded — ${e instanceof Error ? e.message : "error"}`);
    markDone("outline");
  }

  cbs.onStage("article");
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
        searchConsoleQueries: input.searchConsoleQueries,
        googleSuggestions: input.googleSuggestions,
        providerMode: "gemini-only",
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
          cbs.onArticleDelta(parsed.text);
        }
      }
    }
    markDone("article");
    pushLog("Article: stream complete.");
  } catch (e) {
    pushLog(`Article: failed — ${e instanceof Error ? e.message : "error"}`);
  }

  cbs.onStage("audit");
  pushLog("Audit: SEO meta JSON…");
  try {
    const focus =
      keywordList.find((k) => k.type === "primary")?.keyword ?? workingTopic;
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
    if (isRecord(data) && data.meta !== null && isSeoMeta(data.meta)) {
      meta = data.meta;
      cbs.onMeta(meta);
    }
    markDone("audit");
    pushLog("Audit: meta package ready.");
  } catch (e) {
    pushLog(`Audit: degraded — ${e instanceof Error ? e.message : "error"}`);
    cbs.onMeta(null);
  }

  let enrichedHtml: string | null = null;
  const onEnrichedHtml = cbs.onEnrichedHtml;
  const enrichRequested = onEnrichedHtml != null;
  const enrichEligible = articleBody.trim().length >= 80;

  if (onEnrichedHtml && enrichEligible) {
    cbs.onStage("enrich");
    pushLog("Visual enrich: sections → images, charts, tables…");
    try {
      const res = await fetch("/api/seo-enrich", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          markdown: articleBody,
          keyword: workingTopic,
        }),
      });
      const data: unknown = await res.json();
      if (
        res.ok &&
        isRecord(data) &&
        typeof data.html === "string" &&
        data.html.trim()
      ) {
        enrichedHtml = data.html;
        onEnrichedHtml(data.html);
        pushLog("Visual enrich: HTML ready.");
      } else {
        const err =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `HTTP ${res.status}`;
        pushLog(`Visual enrich: skipped — ${err}`);
      }
    } catch (e) {
      pushLog(
        `Visual enrich: failed — ${e instanceof Error ? e.message : "error"}`,
      );
    }
    markDone("enrich");
  } else {
    if (enrichRequested && !enrichEligible) {
      pushLog(
        "Visual enrich: skipped — article body too short for this step (need ≥80 characters).",
      );
    }
    markDone("enrich");
  }

  cbs.onStage(null);
  pushLog("Pipeline finished.");

  return {
    article: articleBody,
    meta,
    keywords: keywordList,
    enrichedHtml,
  };
}
