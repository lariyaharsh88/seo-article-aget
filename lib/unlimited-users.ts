/**
 * Test / owner accounts with no usage or rate limits, from `UNLIMITED_EMAILS`
 * (comma-separated, server-only so the addresses never ship to the browser).
 */
export function isUnlimitedEmail(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  if (!e) return false;
  return (process.env.UNLIMITED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(e);
}
