import { unstable_cache } from "next/cache";
import type { PublishedBlogListItem } from "@/lib/blog-post-query";
import { listPublishedBlogPostsPage } from "@/lib/blog-post-query";
import { coerceDate } from "@/lib/coerce-date";

const cachedPageInner = unstable_cache(
  async (page: number, pageSize: number) =>
    listPublishedBlogPostsPage(page, pageSize),
  ["blog-published-list-page-v1"],
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
): Promise<{ items: PublishedBlogListItem[]; total: number }> {
  const result = await cachedPageInner(page, pageSize);
  return {
    total: result.total,
    items: result.items.map((p) => ({
      ...p,
      createdAt: coerceDate(p.createdAt),
    })),
  };
}
