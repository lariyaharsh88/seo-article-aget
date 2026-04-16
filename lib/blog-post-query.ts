import { Prisma, SiteDomain } from "@prisma/client";
import type { BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_BLOG_SLUGS,
  getStaticBlogPostBySlug,
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
 * List published posts for `/blog` / `/blogs`.
 * Main site (`rankflowhq.com`): curated static AI + SEO articles only (see `ALLOWED_BLOG_SLUGS`).
 * Other domains: PostgreSQL `BlogPost` rows only.
 */
export async function listPublishedBlogPosts(
  siteDomain: SiteDomain,
): Promise<PublishedBlogListItem[]> {
  if (siteDomain === SiteDomain.main) {
    return await listStaticBlogPosts();
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.blogPost.findMany({
        where: { published: true, siteDomain },
        orderBy: { createdAt: "desc" },
        select: publishedBlogSelect,
      });
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      return [];
    }
  }
  return [];
}

/** Paginated list for `/blog` / `/blogs` index. */
export async function listPublishedBlogPostsPage(
  page: number,
  pageSize: number,
  siteDomain: SiteDomain,
): Promise<{ items: PublishedBlogListItem[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page));
  const all = await listPublishedBlogPosts(siteDomain);
  const total = all.length;
  const skip = (safePage - 1) * pageSize;
  return {
    items: all.slice(skip, skip + pageSize),
    total,
  };
}

/**
 * Load a published post by slug for canonical `/blog/[slug]` and `/blogs/[slug]`.
 * Main site uses curated static markdown only (`content/blog-seo-articles`).
 */
export async function findPublishedBlogPostBySlug(
  rawSlug: string,
): Promise<BlogPost | null> {
  const slug = normalizeBlogSlugParam(rawSlug);
  if (!slug) return null;
  const staticPost = await getStaticBlogPostBySlug(slug);
  if (staticPost) return staticPost;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.blogPost.findFirst({
        where: {
          published: true,
          siteDomain: SiteDomain.main,
          AND: [
            { slug },
            { slug: { notIn: [...ALLOWED_BLOG_SLUGS] } },
          ],
        },
      });
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isRetryablePrismaError(err)) {
        await sleep(Math.min(120 * 2 ** (attempt - 1), 2000));
        continue;
      }
      return null;
    }
  }
  return null;
}

/** Other published posts for bottom-of-article internal links (newest first). */
export async function listPublishedBlogPostsExceptSlug(
  rawExcludeSlug: string,
  take = 6,
  siteDomain: SiteDomain,
): Promise<PublishedBlogListItem[]> {
  const excludeSlug = normalizeBlogSlugParam(rawExcludeSlug);
  const all = await listPublishedBlogPosts(siteDomain);
  const filtered = excludeSlug
    ? all.filter((post) => post.slug !== excludeSlug)
    : all;
  return filtered.slice(0, take);
}
