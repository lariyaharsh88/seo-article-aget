import { getSiteUrl } from "@/lib/site-url";

function normalizedHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function siteOriginHost(): string {
  try {
    return normalizedHost(new URL(getSiteUrl()).hostname);
  } catch {
    return "";
  }
}

/**
 * Skip sitemap / sync URLs that must not become “source” education news rows:
 * - This site’s `/news/*` (repurposed articles are not third-party originals)
 * - `images.*` (or similar) hosts with `/news/…` paths — CDN assets, not HTML articles
 * - Bare `/news` index URLs on any host (hub pages, not story URLs)
 */
export function shouldSkipEducationNewsSourceUrl(raw: string): boolean {
  const trimmed = raw?.trim();
  if (!trimmed) return true;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return true;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return true;

  const ours = siteOriginHost();
  const host = normalizedHost(u.hostname);
  const path = u.pathname || "/";
  const pathLower = path.toLowerCase();
  const normPath = pathLower.replace(/\/+$/, "") || "/";

  if (
    ours &&
    host === ours &&
    (normPath === "/news" || pathLower.startsWith("/news/"))
  ) {
    return true;
  }

  if (/^images\./i.test(u.hostname)) {
    if (normPath === "/news" || pathLower.startsWith("/news/")) return true;
  }

  if (normPath === "/news") return true;

  return false;
}
