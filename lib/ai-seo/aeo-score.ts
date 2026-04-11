/**
 * Simple heuristic score for AEO-optimized markdown (structure + length).
 */

export function scoreAeoContent(markdown: string): number {
  const text = markdown.trim();
  if (!text) return 0;

  const words = text.split(/\s+/).filter(Boolean).length;
  const h2 = (text.match(/^##\s+/gm) ?? []).length;
  const h3 = (text.match(/^###\s+/gm) ?? []).length;
  const bullets = (text.match(/^[-*]\s+/gm) ?? []).length;
  const numbered = (text.match(/^\d+[\.)]\s+/gm) ?? []).length;
  const faqHints = /(^|\n)\s*(faq|frequently asked)/i.test(text) ? 1 : 0;
  const questions = (text.match(/\?/g) ?? []).length;

  let score = 0;
  score += Math.min(35, Math.floor(words / 25));
  score += Math.min(25, h2 * 6 + h3 * 3);
  score += Math.min(20, bullets * 2 + numbered * 2);
  score += faqHints * 10;
  score += Math.min(10, Math.floor(questions / 2));

  return Math.max(0, Math.min(100, Math.round(score)));
}
