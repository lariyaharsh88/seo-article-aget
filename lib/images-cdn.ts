/**
 * Optional public host for news hero images (e.g. https://images.rankflowhq.com).
 * Used to rewrite Blob URLs after upload and as a fallback URL pattern for sitemaps.
 * Always returns a value with **https://** so stored and sitemap URLs are valid absolute URLs.
 */
export function getImagesCdnBase(): string | undefined {
  let b = process.env.IMAGES_CDN_BASE?.trim().replace(/\/$/, "");
  if (!b) return undefined;
  if (!/^https?:\/\//i.test(b)) {
    b = `https://${b.replace(/^\/+/, "")}`;
  }
  try {
    const u = new URL(b);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.origin.replace(/^http:/i, "https:");
  } catch {
    return undefined;
  }
}

/**
 * Normalizes a stored or generated image URL for sitemaps and metadata.
 * Scheme-less hosts (e.g. `images.example.com/path`) become `https://…`.
 */
export function toAbsoluteHttpsImageUrl(
  raw: string | null | undefined,
): string | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const withProto = /^https?:\/\//i.test(t)
      ? t
      : t.startsWith("//")
        ? `https:${t}`
        : `https://${t.replace(/^\/+/, "")}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `https://${u.host}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

/** Public hero image URL when stored on `IMAGES_CDN_BASE` at `news/{slug}.png`. */
export function newsHeroPublicUrl(slug: string): string | null {
  const base = getImagesCdnBase();
  if (!base) return null;
  return `${base}/news/${slug}.png`;
}
