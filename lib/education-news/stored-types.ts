/** Serializable row for the education-news dashboard (no full markdown in list). */
export type StoredEducationNewsListItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  lastmod: string;
  repurposeStatus: string;
  repurposedAt: string | null;
  repurposedExcerpt: string | null;
};
