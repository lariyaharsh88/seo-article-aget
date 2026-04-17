import { serverKeyStatus } from "@/lib/api-keys";

export { MAX_FULL_ARTICLE_TOPICS_PER_REQUEST } from "@/lib/article-bulk-limits";

/** Env keys needed for the full SEO pipeline (keywords → research → … → article). */
export function assertArticlePipelineEnvConfigured(): string | null {
  const s = serverKeyStatus();
  const missing: string[] = [];
  if (!s.gemini) missing.push("GEMINI_API_KEY");
  if (!s.serper) missing.push("SERPER_API_KEY");
  if (!s.tavily) missing.push("TAVILY_API_KEY");
  if (missing.length === 0) return null;
  return `Missing environment variables for article generation: ${missing.join(", ")}.`;
}
