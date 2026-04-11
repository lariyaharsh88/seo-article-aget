/**
 * Serializable row for the education-news dashboard (no full markdown in list).
 * `repurposedPath` / `repurposedCanonicalUrl` are set after a successful repurpose.
 */
export type StoredEducationNewsListItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  lastmod: string;
  repurposeStatus: string;
  repurposedAt: string | null;
  repurposedExcerpt: string | null;
  /** Public path on this site, e.g. `/news/my-article-slug`. */
  repurposedPath: string | null;
  /** Full canonical URL (uses NEXT_PUBLIC_SITE_URL / Vercel URL when saved). */
  repurposedCanonicalUrl: string | null;
};
