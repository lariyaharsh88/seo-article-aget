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
  repurposedAt: Date;
};

export async function listReadyRepurposedNews(): Promise<RepurposedNewsListItem[]> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rows = await prisma.educationNewsArticle.findMany({
        where: {
          repurposeStatus: "ready",
          repurposedSlug: { not: null },
          repurposedMarkdown: { not: null },
          repurposedAt: { not: null },
        },
        orderBy: { repurposedAt: "desc" },
        select: {
          id: true,
          repurposedSlug: true,
          title: true,
          source: true,
          repurposedAt: true,
        },
      });
      return rows.map((r) => ({
        id: r.id,
        slug: r.repurposedSlug as string,
        title: r.title,
        source: r.source,
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
  throw new Error("listReadyRepurposedNews: unreachable");
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
