/**
 * Pollinations — free image generation via GET URL (no API key).
 * The browser loads the image from image.pollinations.ai; the service renders from the prompt in the path.
 *
 * @see https://pollinations.ai/
 */
const BASE = "https://image.pollinations.ai/prompt";

/** Stay under typical URL length limits when the prompt is long. */
const MAX_PROMPT_CHARS = 1400;

export function buildPollinationsImageUrl(prompt: string): string {
  const p =
    prompt.trim().slice(0, MAX_PROMPT_CHARS) ||
    "clean minimal editorial blog illustration abstract professional";
  return `${BASE}/${encodeURIComponent(p)}?width=1024&height=576&nologo=true&enhance=true`;
}
