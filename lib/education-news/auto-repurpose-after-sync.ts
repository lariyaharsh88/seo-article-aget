import {
  hasAnyRepurposeKey,
  repurposeKeysFromEnv,
} from "@/lib/education-news/repurpose-llm";
import { runRepurposePending } from "@/lib/education-news/repurpose-runner";

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
  return Math.min(n, 20);
}

/**
 * After sitemap sync, process the pending/error queue (no button needed).
 * Uses `GEMINI_API_KEY` (primary), with OpenRouter/Groq env keys as fallbacks inside the runner.
 * Respects `EDUCATION_NEWS_AUTO_REPURPOSE` and `_LIMIT`.
 */
export async function runAutoRepurposeAfterSync(): Promise<void> {
  if (!autoRepurposeEnabled()) return;
  const keys = repurposeKeysFromEnv();
  if (!hasAnyRepurposeKey(keys)) return;

  const limit = autoRepurposeLimit();
  if (limit === 0) return;

  // Process queue (pending + retriable errors), not only newly inserted ids.
  // This prevents old backlog rows from getting stuck forever.
  try {
    await runRepurposePending(keys, limit);
  } catch (e) {
    console.error("[education-news] auto-repurpose queue failed:", e);
  }
}
