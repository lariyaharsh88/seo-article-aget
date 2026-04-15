import type { SiteDomain } from "@prisma/client";
import { unstable_cache } from "next/cache";
import type { PublishedBlogListItem } from "@/lib/blog-post-query";
import { listPublishedBlogPostsPage } from "@/lib/blog-post-query";
import { coerceDate } from "@/lib/coerce-date";

const cachedPageInner = unstable_cache(
  async (page: number, pageSize: number, siteDomain: SiteDomain) =>
    listPublishedBlogPostsPage(page, pageSize, siteDomain),
  ["blog-published-list-page-v2"],
  {
    revalidate: 120,
    tags: ["blog-posts"],
  },
);

/**
 * Cached paginated list for `/blogs` — survives short pooler blips after a successful
 * fetch. Invalidated via `revalidateTag("blog-posts")` when posts change.
 */
export async function getCachedPublishedBlogPostsPage(
  page: number,
  pageSize: number,
  siteDomain: SiteDomain,
): Promise<{ items: PublishedBlogListItem[]; total: number }> {
  const result = await cachedPageInner(page, pageSize, siteDomain);
  return {
    total: result.total,
    items: result.items.map((p) => ({
      ...p,
      createdAt: coerceDate(p.createdAt),
    })),
  };
}
