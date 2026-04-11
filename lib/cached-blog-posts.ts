import { unstable_cache } from "next/cache";
import { listPublishedBlogPosts } from "@/lib/blog-post-query";

/**
 * Cached published list for /blogs — survives short Supabase/Vercel pooler blips after
 * at least one successful fetch. Invalidated via `revalidateTag("blog-posts")` on create.
 */
export const getCachedPublishedBlogPosts = unstable_cache(
  async () => listPublishedBlogPosts(),
  ["blog-published-list-v1"],
  {
    revalidate: 120,
    tags: ["blog-posts"],
  },
);
