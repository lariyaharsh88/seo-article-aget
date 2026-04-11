/**
 * Pollinations hosts free text-to-image URLs (no API key). Hotlinking is allowed;
 * heavy use may be rate-limited — see https://pollinations.ai/
 */
const MAX_PROMPT_LEN = 420;

export function pollinationsImageUrl(
  imagePrompt: string,
  options?: { width?: number; height?: number },
): string {
  const q = imagePrompt.trim().slice(0, MAX_PROMPT_LEN);
  const width = options?.width ?? 1200;
  const height = options?.height ?? 675;
  const path = encodeURIComponent(q);
  return `https://image.pollinations.ai/prompt/${path}?width=${width}&height=${height}&nologo=true&enhance=true`;
}
