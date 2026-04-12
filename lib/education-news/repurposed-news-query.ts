import { Prisma } from "@prisma/client";
import type { EducationNewsArticle } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryablePrismaError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return false;
}

const MAX_ATTEMPTS = 5;

export function normalizeNewsSlugParam(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

export type RepurposedNewsListItem = {
  id: string;
  slug: string;
  title: string;
  source: string;
  /** Sitemap/source last modified or publication time (stored string). */
  lastmod: string;
  repurposedAt: Date;
};

const readyRepurposedNewsWhere = {
  repurposeStatus: "ready" as const,
  repurposedSlug: { not: null },
  repurposedMarkdown: { not: null },
  repurposedAt: { not: null },
};

const readyRepurposedNewsSelect = {
  id: true,
  repurposedSlug: true,
  title: true,
  source: true,
  lastmod: true,
  repurposedAt: true,
} as const;

function mapReadyNewsRows(
  rows: Array<{
    id: string;
    repurposedSlug: string | null;
    title: string;
    source: string;
    lastmod: string;
    repurposedAt: Date | null;
  }>,
): RepurposedNewsListItem[] {
  return rows
    .filter((r) => Boolean(r.repurposedSlug?.trim()))
    .map((r) => ({
      id: r.id,
      slug: r.repurposedSlug as string,
      title: r.title,
      source: r.source,
      lastmod: r.lastmod,
      repurposedAt: r.repurposedAt as Date,
    }));
}

export async function listReadyRepurposedNews(): Promise<RepurposedNewsListItem[]> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rows = await prisma.educationNewsArticle.findMany({
        where: readyRepurposedNewsWhere,
        orderBy: { repurposedAt: "desc" },
        select: readyRepurposedNewsSelect,
      });
      return mapReadyNewsRows(rows);
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("listReadyRepurposedNews: unreachable");
}

/**
 * Paginated list for `/news` index (newest repurposed articles first).
 */
export async function listReadyRepurposedNewsPage(
  page: number,
  pageSize: number,
): Promise<{ items: RepurposedNewsListItem[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page));
  const skip = (safePage - 1) * pageSize;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const [total, rows] = await Promise.all([
        prisma.educationNewsArticle.count({ where: readyRepurposedNewsWhere }),
        prisma.educationNewsArticle.findMany({
          where: readyRepurposedNewsWhere,
          orderBy: { repurposedAt: "desc" },
          skip,
          take: pageSize,
          select: readyRepurposedNewsSelect,
        }),
      ]);
      return { items: mapReadyNewsRows(rows), total };
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("listReadyRepurposedNewsPage: unreachable");
}

export async function findReadyRepurposedNewsBySlug(
  rawSlug: string,
): Promise<EducationNewsArticle | null> {
  const slug = normalizeNewsSlugParam(rawSlug);
  if (!slug) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.educationNewsArticle.findFirst({
        where: {
          repurposedSlug: slug,
          repurposeStatus: "ready",
          repurposedMarkdown: { not: null },
        },
      });
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("findReadyRepurposedNewsBySlug: unreachable");
}

/** Other ready news articles for bottom-of-page internal links (newest first). */
export async function listReadyRepurposedNewsExceptSlug(
  rawExcludeSlug: string,
  take = 6,
): Promise<RepurposedNewsListItem[]> {
  const excludeSlug = normalizeNewsSlugParam(rawExcludeSlug);
  if (!excludeSlug) {
    const all = await listReadyRepurposedNews();
    return all.slice(0, take);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rows = await prisma.educationNewsArticle.findMany({
        where: {
          repurposeStatus: "ready",
          repurposedMarkdown: { not: null },
          repurposedAt: { not: null },
          repurposedSlug: { not: null },
          NOT: { repurposedSlug: excludeSlug },
        },
        orderBy: { updatedAt: "desc" },
        take,
        select: {
          id: true,
          repurposedSlug: true,
          title: true,
          source: true,
          lastmod: true,
          repurposedAt: true,
        },
      });
      return rows
        .filter((r) => Boolean(r.repurposedSlug?.trim()))
        .map((r) => ({
          id: r.id,
          slug: r.repurposedSlug as string,
          title: r.title,
          source: r.source,
          lastmod: r.lastmod,
          repurposedAt: r.repurposedAt as Date,
        }));
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("listReadyRepurposedNewsExceptSlug: unreachable");
}
