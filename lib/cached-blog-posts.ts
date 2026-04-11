import { unstable_cache } from "next/cache";
import type { PublishedBlogListItem } from "@/lib/blog-post-query";
import { listPublishedBlogPosts } from "@/lib/blog-post-query";
import { coerceDate } from "@/lib/coerce-date";

const cachedListInner = unstable_cache(
  async () => listPublishedBlogPosts(),
  ["blog-published-list-v1"],
  {
    revalidate: 120,
    tags: ["blog-posts"],
  },
);

/**
 * Cached published list for /blogs — survives short Supabase/Vercel pooler blips after
 * at least one successful fetch. Invalidated via `revalidateTag("blog-posts")` on create.
 *
 * Restores `Date` on `createdAt`: cache hits deserialize ISO strings, which would break
 * `.toISOString()` in the UI without coercion.
 */
export async function getCachedPublishedBlogPosts(): Promise<
  PublishedBlogListItem[]
> {
  const rows = await cachedListInner();
  return rows.map((p) => ({
    ...p,
    createdAt: coerceDate(p.createdAt),
  }));
}
