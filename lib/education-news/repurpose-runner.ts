import { revalidatePath } from "next/cache";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import { slugify } from "@/lib/blog-slug";
import { fetchArticlePlainText } from "@/lib/education-news/fetch-article-text";
import {
  generateRepurposeMarkdown,
  hasAnyRepurposeKey,
  type RepurposeLlmKeys,
} from "@/lib/education-news/repurpose-llm";
import { buildEducationNewsRepurposePrompt } from "@/lib/education-news/repurpose-prompt";
import { ensureUniqueRepurposedSlug } from "@/lib/education-news/repurpose-news-slug";
import { createAndStoreNewsHeroImage } from "@/lib/education-news/upload-news-hero-image";
import { prisma } from "@/lib/prisma";
import { notifyGoogleSitemaps } from "@/lib/google-indexing";
import { notifyIndexNowIfConfigured } from "@/lib/indexnow-submit";
import { absoluteUrlForSiteDomain } from "@/lib/site-domain";
import { notifyTelegramNewsRepurposed } from "@/lib/telegram-channel";

/** 0–100 for one article; optional article index when batching. */
export type RepurposeProgressUpdate = {
  percent: number;
  step: string;
  articleIndex?: number;
  articleTotal?: number;
};

function mapInnerToRange(
  innerPct: number,
  rangeMin: number,
  rangeMax: number,
): number {
  return Math.min(
    100,
    Math.round(rangeMin + (innerPct / 100) * (rangeMax - rangeMin)),
  );
}

function extractFirstMarkdownH1(markdown: string): string | null {
  const lines = markdown.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      const h1 = line.replace(/^#\s+/, "").trim();
      if (h1) return h1.slice(0, 500);
    }
    if (line.startsWith("##")) break;
  }
  return null;
}

function inferHeadingKeyword(title: string): string {
  const clean = title
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "Exam Update";
  const tokens = clean.split(" ").filter(Boolean);
  const stop = new Set([
    "out",
    "live",
    "today",
    "released",
    "download",
    "pdf",
    "direct",
    "link",
    "check",
    "details",
    "notification",
    "updates",
    "update",
  ]);
  const selected = tokens
    .filter((t) => !/^\d{4}$/.test(t))
    .filter((t) => !stop.has(t.toLowerCase()))
    .slice(0, 3);
  return selected.join(" ").trim() || tokens.slice(0, 2).join(" ").trim() || "Exam Update";
}

function inferSecondaryKeyword(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("admit card")) return "Admit Card";
  if (t.includes("answer key")) return "Answer Key";
  if (t.includes("result")) return "Result";
  if (t.includes("exam date")) return "Exam Date";
  if (t.includes("counselling")) return "Counselling";
  if (t.includes("cut off") || t.includes("cutoff")) return "Cut Off";
  if (t.includes("merit list")) return "Merit List";
  if (t.includes("notification")) return "Notification";
  return "Latest Update";
}

function lineHasKeyword(line: string, keywords: string[]): boolean {
  return keywords.some((k) => {
    const safe = k.trim();
    if (!safe) return false;
    const re = new RegExp(`\\b${safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(line);
  });
}

function enforceKeywordInNewsHeadings(
  markdown: string,
  primaryKeyword: string,
  secondaryKeyword: string,
): string {
  const lines = markdown.split(/\r?\n/);
  const primary = primaryKeyword.trim();
  const secondary = secondaryKeyword.trim();
  if (!primary && !secondary) return markdown;
  const headingKeywords = [primary, secondary].filter(Boolean);

  const h2Idx: number[] = [];
  const h3Idx: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^##\s+/.test(line) && !/^###\s+/.test(line)) h2Idx.push(i);
    if (/^###\s+/.test(line)) h3Idx.push(i);
  }

  for (const i of [...h2Idx, ...h3Idx]) {
    if (lineHasKeyword(lines[i], headingKeywords)) continue;
    const prefix = lines[i].startsWith("###") ? "###" : "##";
    const heading = lines[i].replace(/^###?\s+/, "").trim();
    const suffix = secondary || primary;
    lines[i] = `${prefix} ${heading} - ${suffix}`;
  }

  if (secondary) {
    const allHeadingIdx = [...h2Idx, ...h3Idx];
    const hasSecondary = allHeadingIdx.some((i) => lineHasKeyword(lines[i], [secondary]));
    if (!hasSecondary && allHeadingIdx.length > 0) {
      const i = h3Idx[0] ?? h2Idx[0];
      const prefix = lines[i].startsWith("###") ? "###" : "##";
      const heading = lines[i].replace(/^###?\s+/, "").trim();
      lines[i] = `${prefix} ${heading} - ${secondary}`;
    }
  }

  return lines.join("\n");
}

export async function runRepurposeForArticleId(
  id: string,
  llmKeys: RepurposeLlmKeys,
  onProgress?: (u: RepurposeProgressUpdate) => void,
  range?: { min: number; max: number },
): Promise<void> {
  if (!hasAnyRepurposeKey(llmKeys)) {
    throw new Error(
      "No LLM keys configured (set GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY).",
    );
  }

  const lo = range?.min ?? 0;
  const hi = range?.max ?? 100;
  const emit = (inner: number, step: string) =>
    onProgress?.({
      percent: mapInnerToRange(inner, lo, hi),
      step,
    });

  emit(4, "Starting repurposing…");
  const row = await prisma.educationNewsArticle.findUnique({ where: { id } });
  if (!row) {
    throw new Error("Article not found");
  }

  emit(10, "Loading row from database…");
  await prisma.educationNewsArticle.update({
    where: { id },
    data: { repurposeStatus: "processing", errorMessage: null },
  });

  try {
    let plain = row.rawArticleText;
    if (!plain?.trim()) {
      emit(22, "Fetching source article page (may be blocked by publisher)…");
      plain = await fetchArticlePlainText(row.url);
      emit(38, plain ? "Extracted page text" : "No page text — using headline only");
      await prisma.educationNewsArticle.update({
        where: { id },
        data: {
          rawArticleText: plain,
          rawFetchedAt: plain ? new Date() : null,
        },
      });
    } else {
      emit(35, "Using cached page text from database…");
    }

    emit(48, "Building SEO repurposing prompt…");
    const prompt = buildEducationNewsRepurposePrompt({
      title: row.title,
      source: row.source,
      originalUrl: row.url,
      plainTextFromPage: plain,
    });

    const mdRaw = await generateRepurposeMarkdown(prompt, llmKeys, (step) =>
      emit(55, step),
    );
    const md = enforceKeywordInNewsHeadings(
      mdRaw,
      inferHeadingKeyword(row.title),
      inferSecondaryKeyword(row.title),
    );

    emit(88, "Validating output length…");
    if (md.length < 200) {
      throw new Error("Model returned too little text");
    }
    const optimizedTitle = extractFirstMarkdownH1(md) || row.title.slice(0, 500);

    emit(94, "Saving repurposed draft to database…");
    let repurposedSlug = row.repurposedSlug?.trim() || null;
    if (!repurposedSlug) {
      const base = slugify(row.title);
      repurposedSlug = await ensureUniqueRepurposedSlug(base, id);
    }
    const sitePath = `/news/${repurposedSlug}`;
    const repurposedCanonicalUrl = absoluteUrlForSiteDomain(
      row.siteDomain,
      sitePath,
    );

    await prisma.educationNewsArticle.update({
      where: { id },
      data: {
        title: optimizedTitle,
        repurposedMarkdown: md,
        repurposedAt: new Date(),
        repurposeStatus: "ready",
        errorMessage: null,
        repurposedSlug,
        repurposedCanonicalUrl,
        authorName: DEFAULT_ARTICLE_AUTHOR_NAME,
      },
    });

    notifyTelegramNewsRepurposed({
      title: row.title,
      repurposedMarkdown: md,
      slug: repurposedSlug,
      siteDomain: row.siteDomain,
    });

    emit(96, "Publishing hero image to images CDN…");
    try {
      await createAndStoreNewsHeroImage({
        articleId: id,
        slug: repurposedSlug,
        title: row.title,
        examLogoUrl: row.examLogoUrl,
      });
    } catch (imgErr) {
      console.error("[education-news] hero image:", imgErr);
    }

    try {
      revalidatePath("/news");
      revalidatePath(sitePath);
      revalidatePath("/news/sitemap.xml");
      revalidatePath("/education/sitemap.xml");
    } catch {
      /* e.g. script context without Next cache */
    }

    void notifyIndexNowIfConfigured({
      articleUrl: repurposedCanonicalUrl,
    });
    try {
      const articleOrigin = new URL(repurposedCanonicalUrl).origin;
      void notifyGoogleSitemaps({
        siteOrigin: articleOrigin,
        sitemapPaths: ["/sitemap.xml", "/news/sitemap.xml"],
      });
    } catch {
      /* ignore malformed url edge cases */
    }

    emit(100, "Done");
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 2000) : "Repurpose failed";
    await prisma.educationNewsArticle.update({
      where: { id },
      data: {
        repurposeStatus: "error",
        errorMessage: msg,
      },
    });
    throw e;
  }
}

/** Process up to `limit` rows stuck in pending/error (FIFO by updatedAt). */
export async function runRepurposePending(
  llmKeys: RepurposeLlmKeys,
  limit: number,
  onProgress?: (u: RepurposeProgressUpdate) => void,
): Promise<{
  processed: number;
  failed: number;
  ids: string[];
  failedIds: string[];
}> {
  const rows = await prisma.educationNewsArticle.findMany({
    where: { repurposeStatus: { in: ["pending", "error"] } },
    orderBy: { updatedAt: "asc" },
    take: Math.min(Math.max(limit, 1), 5),
    select: { id: true },
  });

  const n = rows.length;
  const ids: string[] = [];
  const failedIds: string[] = [];
  if (n === 0) {
    onProgress?.({
      percent: 100,
      step: "No pending articles to process",
    });
    return { processed: 0, failed: 0, ids: [], failedIds: [] };
  }

  for (let i = 0; i < n; i++) {
    const r = rows[i];
    const rangeMin = (i / n) * 100;
    const rangeMax = ((i + 1) / n) * 100;
    try {
      await runRepurposeForArticleId(
        r.id,
        llmKeys,
        (u) =>
          onProgress?.({
            percent: u.percent,
            step: u.step,
            articleIndex: i + 1,
            articleTotal: n,
          }),
        { min: rangeMin, max: rangeMax },
      );
      ids.push(r.id);
    } catch (e) {
      failedIds.push(r.id);
      onProgress?.({
        percent: Math.round(rangeMax),
        step: `Failed article ${i + 1}/${n}; continuing queue`,
        articleIndex: i + 1,
        articleTotal: n,
      });
      console.error("[education-news] repurpose queue item failed:", r.id, e);
    }
  }
  onProgress?.({
    percent: 100,
    step: `Finished queue: ${ids.length} success, ${failedIds.length} failed`,
    articleIndex: n,
    articleTotal: n,
  });
  return {
    processed: ids.length,
    failed: failedIds.length,
    ids,
    failedIds,
  };
}
