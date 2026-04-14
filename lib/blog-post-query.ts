import { Prisma } from "@prisma/client";
import type { BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getStaticBlogPostBySlug,
  isAllowedBlogSlug,
  listStaticBlogPosts,
} from "@/lib/static-blog-posts";

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

/** Connection / pool / timeout issues worth retrying (cold start, pooler blips). */
function isRetryablePrismaError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return [
      "P1001", // Can't reach database server
      "P1002", // Connection timeout
      "P1008", // Operations timed out
      "P1017", // Server closed the connection
      "P2024", // Timed out fetching a new connection from the pool
    ].includes(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return false;
}

const MAX_ATTEMPTS = 5;

export type PublishedBlogListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  createdAt: Date;
};

const publishedBlogSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  createdAt: true,
} as const;

/**
 * List published posts for /blogs. Retries on transient DB errors so cold
 * starts and pool blips do not yield an empty list.
 */
export async function listPublishedBlogPosts(): Promise<PublishedBlogListItem[]> {
  const staticPosts = await listStaticBlogPosts();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbPosts = await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: publishedBlogSelect,
      });
      const allowedDbPosts = dbPosts.filter((post) => isAllowedBlogSlug(post.slug));
      const merged = [...allowedDbPosts, ...staticPosts];
      const deduped = Array.from(new Map(merged.map((p) => [p.slug, p])).values());
      return deduped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      return staticPosts;
    }
  }
  return staticPosts;
}

/**
 * Paginated list for `/blogs` index. Retries on transient DB errors.
 */
export async function listPublishedBlogPostsPage(
  page: number,
  pageSize: number,
): Promise<{ items: PublishedBlogListItem[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page));
  const staticPosts = await listStaticBlogPosts();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbItems = await prisma.blogPost.findMany({
          where: { published: true },
          orderBy: { createdAt: "desc" },
          select: publishedBlogSelect,
        });
      const allowedDbItems = dbItems.filter((post) => isAllowedBlogSlug(post.slug));
      const merged = [...allowedDbItems, ...staticPosts];
      const deduped = Array.from(new Map(merged.map((p) => [p.slug, p])).values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const total = deduped.length;
      const skip = (safePage - 1) * pageSize;
      const items = deduped.slice(skip, skip + pageSize);
      return { items, total };
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      const deduped = Array.from(
        new Map(staticPosts.map((p) => [p.slug, p])).values(),
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const skip = (safePage - 1) * pageSize;
      return { items: deduped.slice(skip, skip + pageSize), total: deduped.length };
    }
  }
  const skip = (safePage - 1) * pageSize;
  return { items: staticPosts.slice(skip, skip + pageSize), total: staticPosts.length };
}

/**
 * Load a published post by slug. Retries on transient DB / pool errors so
 * cold starts and brief connection issues do not surface as 404.
 */
export async function findPublishedBlogPostBySlug(
  rawSlug: string,
): Promise<BlogPost | null> {
  const slug = normalizeBlogSlugParam(rawSlug);
  if (!slug) return null;
  if (!isAllowedBlogSlug(slug)) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbPost = await prisma.blogPost.findFirst({
        where: { slug, published: true },
      });
      return dbPost ?? (await getStaticBlogPostBySlug(slug));
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      return getStaticBlogPostBySlug(slug);
    }
  }
  return getStaticBlogPostBySlug(slug);
}

/** Other published posts for bottom-of-article internal links (newest first). */
export async function listPublishedBlogPostsExceptSlug(
  rawExcludeSlug: string,
  take = 6,
): Promise<PublishedBlogListItem[]> {
  const excludeSlug = normalizeBlogSlugParam(rawExcludeSlug);
  if (!excludeSlug || !isAllowedBlogSlug(excludeSlug)) {
    const all = await listPublishedBlogPosts();
    return all.slice(0, take);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbPosts = await prisma.blogPost.findMany({
        where: { published: true, slug: { not: excludeSlug } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          createdAt: true,
        },
      });
      const staticPosts = await listStaticBlogPosts();
      const allowedDbPosts = dbPosts.filter((post) => isAllowedBlogSlug(post.slug));
      const merged = [...allowedDbPosts, ...staticPosts].filter(
        (post) => post.slug !== excludeSlug,
      );
      const deduped = Array.from(new Map(merged.map((p) => [p.slug, p])).values());
      return deduped.slice(0, take);
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      const staticPosts = await listStaticBlogPosts();
      return staticPosts.filter((post) => post.slug !== excludeSlug).slice(0, take);
    }
  }
  const staticPosts = await listStaticBlogPosts();
  return staticPosts.filter((post) => post.slug !== excludeSlug).slice(0, take);
}
