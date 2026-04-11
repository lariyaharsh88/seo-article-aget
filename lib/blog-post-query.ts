import { Prisma } from "@prisma/client";
import type { BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** URL segment → slug as stored in DB (handles encoding, trim). */
export function normalizeBlogSlugParam(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function isRetryablePrismaError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1017", "P2024"].includes(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return false;
}

const MAX_ATTEMPTS = 3;

/**
 * Load a published post by slug. Retries on transient DB / pool errors so
 * cold starts and brief connection issues do not surface as 404.
 */
export async function findPublishedBlogPostBySlug(
  rawSlug: string,
): Promise<BlogPost | null> {
  const slug = normalizeBlogSlugParam(rawSlug);
  if (!slug) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.blogPost.findFirst({
        where: { slug, published: true },
      });
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(80 * attempt);
        continue;
      }
      throw err;
    }
  }
  throw new Error("findPublishedBlogPostBySlug: unreachable");
}
