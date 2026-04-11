/**
 * Optional public host for news hero images (e.g. https://images.rankflowhq.com).
 * Used to rewrite Blob URLs after upload and as a fallback URL pattern for sitemaps.
 */
export function getImagesCdnBase(): string | undefined {
  const b = process.env.IMAGES_CDN_BASE?.trim().replace(/\/$/, "");
  return b || undefined;
}

/** Public hero image URL when stored on `IMAGES_CDN_BASE` at `news/{slug}.png`. */
export function newsHeroPublicUrl(slug: string): string | null {
  const base = getImagesCdnBase();
  if (!base) return null;
  return `${base}/news/${slug}.png`;
}
