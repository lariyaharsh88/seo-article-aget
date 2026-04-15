import { Prisma, SiteDomain } from "@prisma/client";
import type { BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStaticBlogPostBySlug, listStaticBlogPosts } from "@/lib/static-blog-posts";

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

function mergeDbAndStaticLists(
  dbItems: PublishedBlogListItem[],
  staticItems: PublishedBlogListItem[],
): PublishedBlogListItem[] {
  const map = new Map<string, PublishedBlogListItem>();
  for (const s of staticItems) map.set(s.slug, s);
  for (const d of dbItems) map.set(d.slug, d);
  return Array.from(map.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

/**
 * List published posts for `/blogs` on the given site domain (static SEO articles only on main).
 */
export async function listPublishedBlogPosts(
  siteDomain: SiteDomain,
): Promise<PublishedBlogListItem[]> {
  const staticPosts =
    siteDomain === SiteDomain.main ? await listStaticBlogPosts() : [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbPosts = await prisma.blogPost.findMany({
        where: { published: true, siteDomain },
        orderBy: { createdAt: "desc" },
        select: publishedBlogSelect,
      });
      return mergeDbAndStaticLists(dbPosts, staticPosts);
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

/** Paginated list for `/blogs` index. */
export async function listPublishedBlogPostsPage(
  page: number,
  pageSize: number,
  siteDomain: SiteDomain,
): Promise<{ items: PublishedBlogListItem[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page));
  const staticPosts =
    siteDomain === SiteDomain.main ? await listStaticBlogPosts() : [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbItems = await prisma.blogPost.findMany({
        where: { published: true, siteDomain },
        orderBy: { createdAt: "desc" },
        select: publishedBlogSelect,
      });
      const deduped = mergeDbAndStaticLists(dbItems, staticPosts);
      const total = deduped.length;
      const skip = (safePage - 1) * pageSize;
      const items = deduped.slice(skip, skip + pageSize);
      return { items, total };
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      const deduped = mergeDbAndStaticLists([], staticPosts);
      const skip = (safePage - 1) * pageSize;
      return {
        items: deduped.slice(skip, skip + pageSize),
        total: deduped.length,
      };
    }
  }
  const skip = (safePage - 1) * pageSize;
  return {
    items: staticPosts.slice(skip, skip + pageSize),
    total: staticPosts.length,
  };
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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const dbPost = await prisma.blogPost.findFirst({
        where: { slug, published: true },
      });
      if (dbPost) return dbPost;
      return await getStaticBlogPostBySlug(slug);
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
  siteDomain: SiteDomain,
): Promise<PublishedBlogListItem[]> {
  const excludeSlug = normalizeBlogSlugParam(rawExcludeSlug);
  if (!excludeSlug) {
    const all = await listPublishedBlogPosts(siteDomain);
    return all.slice(0, take);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const staticPosts =
        siteDomain === SiteDomain.main ? await listStaticBlogPosts() : [];
      const dbPosts = await prisma.blogPost.findMany({
        where: {
          published: true,
          siteDomain,
          slug: { not: excludeSlug },
        },
        orderBy: { updatedAt: "desc" },
        select: publishedBlogSelect,
      });
      const merged = mergeDbAndStaticLists(dbPosts, staticPosts).filter(
        (post) => post.slug !== excludeSlug,
      );
      return merged.slice(0, take);
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      const staticPosts =
        siteDomain === SiteDomain.main ? await listStaticBlogPosts() : [];
      return staticPosts
        .filter((post) => post.slug !== excludeSlug)
        .slice(0, take);
    }
  }
  const staticPosts =
    siteDomain === SiteDomain.main ? await listStaticBlogPosts() : [];
  return staticPosts
    .filter((post) => post.slug !== excludeSlug)
    .slice(0, take);
}
