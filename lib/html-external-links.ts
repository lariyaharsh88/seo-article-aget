import { load } from "cheerio";
import { getSiteUrl } from "@/lib/site-url";

let cachedOrigin: string | null = null;

function articleSiteOrigin(): string {
  if (cachedOrigin) return cachedOrigin;
  try {
    cachedOrigin = new URL(getSiteUrl()).origin;
    return cachedOrigin;
  } catch {
    cachedOrigin = "http://localhost:3000";
    return cachedOrigin;
  }
}

/**
 * Adds `rel="nofollow noopener noreferrer"` and `target="_blank"` to anchors that leave this site.
 * Same-origin and hash/mailto/tel links are unchanged.
 */
export function addExternalLinkRelToHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return html;
  const origin = articleSiteOrigin();
  const $ = load(trimmed, null, false);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const t = href.trim();
    if (
      t.startsWith("#") ||
      t.startsWith("mailto:") ||
      t.startsWith("tel:") ||
      t.toLowerCase().startsWith("javascript:")
    ) {
      return;
    }
    try {
      const resolved = new URL(t, origin);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
        return;
      }
      if (resolved.origin === origin) return;

      const existing = ($(el).attr("rel") || "").split(/\s+/).filter(Boolean);
      const rel = new Set(existing);
      rel.add("nofollow");
      rel.add("noopener");
      rel.add("noreferrer");
      $(el).attr("rel", Array.from(rel).join(" "));
      if (!$(el).attr("target")) {
        $(el).attr("target", "_blank");
      }
    } catch {
      /* bad href */
    }
  });

  return $.html();
}
