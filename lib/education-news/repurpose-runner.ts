import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/blog-slug";
import { geminiText } from "@/lib/gemini";
import { fetchArticlePlainText } from "@/lib/education-news/fetch-article-text";
import { buildEducationNewsRepurposePrompt } from "@/lib/education-news/repurpose-prompt";
import { ensureUniqueRepurposedSlug } from "@/lib/education-news/repurpose-news-slug";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

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

export async function runRepurposeForArticleId(
  id: string,
  geminiKey: string,
  onProgress?: (u: RepurposeProgressUpdate) => void,
  range?: { min: number; max: number },
): Promise<void> {
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

    emit(55, "Gemini is writing (800–1000 words)…");
    const md = (
      await geminiText(prompt, geminiKey, {
        temperature: 0.55,
        maxOutputTokens: 4096,
      })
    ).trim();

    emit(88, "Validating output length…");
    if (md.length < 200) {
      throw new Error("Model returned too little text");
    }

    emit(94, "Saving repurposed draft to database…");
    let repurposedSlug = row.repurposedSlug?.trim() || null;
    if (!repurposedSlug) {
      const base = slugify(row.title);
      repurposedSlug = await ensureUniqueRepurposedSlug(base, id);
    }
    const sitePath = `/news/${repurposedSlug}`;
    const repurposedCanonicalUrl = `${getSiteUrl()}${sitePath}`;

    await prisma.educationNewsArticle.update({
      where: { id },
      data: {
        repurposedMarkdown: md,
        repurposedAt: new Date(),
        repurposeStatus: "ready",
        errorMessage: null,
        repurposedSlug,
        repurposedCanonicalUrl,
      },
    });
    try {
      revalidatePath("/news");
      revalidatePath(sitePath);
      revalidatePath("/news/sitemap.xml");
    } catch {
      /* e.g. script context without Next cache */
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
  geminiKey: string,
  limit: number,
  onProgress?: (u: RepurposeProgressUpdate) => void,
): Promise<{ processed: number; ids: string[] }> {
  const rows = await prisma.educationNewsArticle.findMany({
    where: { repurposeStatus: { in: ["pending", "error"] } },
    orderBy: { updatedAt: "asc" },
    take: Math.min(Math.max(limit, 1), 5),
    select: { id: true },
  });

  const n = rows.length;
  const ids: string[] = [];
  if (n === 0) {
    onProgress?.({
      percent: 100,
      step: "No pending articles to process",
    });
    return { processed: 0, ids: [] };
  }

  for (let i = 0; i < n; i++) {
    const r = rows[i];
    const rangeMin = (i / n) * 100;
    const rangeMax = ((i + 1) / n) * 100;
    await runRepurposeForArticleId(
      r.id,
      geminiKey,
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
  }
  onProgress?.({
    percent: 100,
    step: `Finished ${n} article(s)`,
    articleIndex: n,
    articleTotal: n,
  });
  return { processed: ids.length, ids };
}
