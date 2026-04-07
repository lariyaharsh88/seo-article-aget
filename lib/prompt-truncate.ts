/** Avoid oversized prompts that can cause Gemini generate/stream requests to fail. */
export function capPromptText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n[…truncated for API limits — ${t.length - max} chars omitted]`;
}
