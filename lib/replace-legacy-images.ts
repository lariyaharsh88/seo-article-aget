import { brandedCardUrl } from "@/lib/seo-enrichment/section-image";

/**
 * Older articles hot-link image.pollinations.ai, whose free tier now serves a "Free limit reached"
 * banner instead of the picture. Swap those <img> sources for our branded card, at render time.
 */
const POLLINATIONS_IMG = /<img\b[^>]*\bsrc\s*=\s*(["'])https?:\/\/image\.pollinations\.ai\/[^"']*\1[^>]*>/gi;

export function replaceLegacyImages(html: string): string {
  if (!html || !html.includes("pollinations.ai")) return html;
  let i = 0;
  return html.replace(POLLINATIONS_IMG, (tag) => {
    const alt = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i)?.[2]?.trim() || "Illustration";
    const url = brandedCardUrl(alt.replace(/&amp;/g, "&").replace(/&quot;/g, '"'), "", i++);
    return tag.replace(/\bsrc\s*=\s*(["'])[^"']*\1/i, `src="${url.replace(/&/g, "&amp;")}"`);
  });
}
