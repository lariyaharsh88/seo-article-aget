/**
 * Dedupe and merge Google suggestions with AI-generated prompts.
 */

export function dedupeQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const k = q.trim().toLowerCase();
    if (k.length < 3 || seen.has(k)) continue;
    seen.add(k);
    out.push(q.trim());
  }
  return out;
}

/** Parse "one question per line" or numbered list from LLM output. */
export function parseAiQuestionLines(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const out: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    const stripped = line
      .replace(/^\d+[\.)]\s*/, "")
      .replace(/^[-*•]\s*/, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (stripped.length >= 8 && stripped.length < 240) {
      out.push(stripped);
    }
  }
  return out.slice(0, 40);
}
