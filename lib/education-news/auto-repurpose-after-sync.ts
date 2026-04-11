import { runRepurposeForArticleId } from "@/lib/education-news/repurpose-runner";

function autoRepurposeEnabled(): boolean {
  const v = process.env.EDUCATION_NEWS_AUTO_REPURPOSE?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") {
    return false;
  }
  return true;
}

/** Max articles to repurpose per sync (each run can take tens of seconds). */
function autoRepurposeLimit(): number {
  const raw = process.env.EDUCATION_NEWS_AUTO_REPURPOSE_LIMIT?.trim();
  const n = raw ? parseInt(raw, 10) : 2;
  if (Number.isNaN(n) || n < 1) return 0;
  return Math.min(n, 5);
}

/**
 * After sitemap sync, repurpose newly inserted `pending` rows (no button needed).
 * Uses `GEMINI_API_KEY`. Respects `EDUCATION_NEWS_AUTO_REPURPOSE` and `_LIMIT`.
 */
export async function runAutoRepurposeAfterSync(
  newPendingIds: string[],
): Promise<void> {
  if (!autoRepurposeEnabled() || newPendingIds.length === 0) return;
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return;

  const limit = autoRepurposeLimit();
  if (limit === 0) return;

  const slice = newPendingIds.slice(0, limit);
  for (const id of slice) {
    try {
      await runRepurposeForArticleId(id, key);
    } catch (e) {
      console.error("[education-news] auto-repurpose failed:", id, e);
    }
  }
}
