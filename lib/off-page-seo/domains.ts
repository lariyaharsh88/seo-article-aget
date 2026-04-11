/** Block obvious platforms / non-prospects. */
const BLOCKED_ROOTS = new Set([
  "google.com",
  "google.co.in",
  "gstatic.com",
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "amazon.com",
  "amazon.in",
  "wikipedia.org",
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "tiktok.com",
  "apple.com",
  "microsoft.com",
  "bing.com",
  "yahoo.com",
  "medium.com",
  "wordpress.com",
  "blogspot.com",
  "tumblr.com",
  "github.com",
  "gitlab.com",
]);

export function normalizeInputDomain(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.split("/")[0] ?? s;
  s = s.split(":")[0] ?? s;
  return s;
}

export function hostnameFromUrl(urlStr: string): string | null {
  try {
    const u = urlStr.startsWith("http") ? new URL(urlStr) : new URL(`https://${urlStr}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function rootDomainKey(host: string): string {
  return host.replace(/^www\./, "").toLowerCase();
}

export function isProspectDomain(host: string, excludeDomain: string): boolean {
  const key = rootDomainKey(host);
  const ex = rootDomainKey(excludeDomain);
  if (!key || key === ex) return false;
  if (key.endsWith(`.${ex}`)) return false;
  const parts = key.split(".");
  if (parts.length < 2) return false;
  if (shouldBlockHost(key)) return false;
  return true;
}

export function shouldBlockHost(host: string): boolean {
  const key = rootDomainKey(host);
  if (BLOCKED_ROOTS.has(key)) return true;
  if (key.includes("google.")) return true;
  return false;
}
