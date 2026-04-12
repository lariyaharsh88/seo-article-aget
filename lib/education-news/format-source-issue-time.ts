/**
 * Formats sitemap `lastmod` for display as source issue time in IST.
 * Unparseable values are returned trimmed (exact string from DB).
 */
export function formatSourceIssueTimeIst(lastmod: string): string {
  const raw = lastmod.trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw;
  }
  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
  return `${formatted} IST`;
}
