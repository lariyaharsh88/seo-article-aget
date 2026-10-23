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

/** Matches one attribute in an opening tag: name, then a double-, single- or unquoted value. */
const ATTR_RE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function decodeEntities(v: string): string {
  return v
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Adds `rel="nofollow noopener noreferrer"` and `target="_blank"` to anchors that leave this site.
 * Same-origin and hash/mailto/tel links are unchanged.
 * Dependency-free (no cheerio) so it can ship in client bundles via lib/markdown-to-html.
 */
export function addExternalLinkRelToHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return html;
  const origin = articleSiteOrigin();

  return trimmed.replace(/<a(\s[^>]*)?>/gi, (tag, rawAttrs: string | undefined) => {
    const attrs = rawAttrs ?? "";
    let href: string | null = null;
    let rel = "";
    let hasTarget = false;
    for (const m of Array.from(attrs.matchAll(ATTR_RE))) {
      const name = m[1].toLowerCase();
      const value = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
      if (name === "href") href = value;
      else if (name === "rel") rel = value;
      else if (name === "target") hasTarget = true;
    }
    if (!href) return tag;
    const t = href.trim();
    if (
      t.startsWith("#") ||
      t.startsWith("mailto:") ||
      t.startsWith("tel:") ||
      t.toLowerCase().startsWith("javascript:")
    ) {
      return tag;
    }
    try {
      const resolved = new URL(t, origin);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return tag;
      if (resolved.origin === origin) return tag;
    } catch {
      return tag;
    }

    const relSet = new Set(rel.split(/\s+/).filter(Boolean));
    relSet.add("nofollow");
    relSet.add("noopener");
    relSet.add("noreferrer");
    const relValue = Array.from(relSet).join(" ");
    let out = attrs.replace(/\srel\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/i, "");
    out = out.replace(/\s*\/?\s*$/, "");
    out += ` rel="${relValue}"`;
    if (!hasTarget) out += ' target="_blank"';
    return `<a${out}>`;
  });
}
