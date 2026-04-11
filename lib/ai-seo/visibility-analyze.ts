/**
 * Parse LLM response to detect brand/domain mention and rough list position.
 */

export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.split("/")[0] ?? d;
  d = d.split("?")[0] ?? d;
  return d;
}

function domainMentionedInText(text: string, domain: string): boolean {
  const norm = normalizeDomain(domain);
  const lower = text.toLowerCase();
  if (!norm) return false;
  if (lower.includes(norm)) return true;
  if (norm.startsWith("www.")) {
    return lower.includes(norm.slice(4));
  }
  return lower.includes(`www.${norm}`);
}

/**
 * Finds 1-based position in numbered / bulleted list lines where domain appears first.
 * If no structured list, estimates a rough rank from early text position.
 */
export function estimateVisibilityPosition(
  responseText: string,
  domain: string,
): { mentioned: boolean; position: number | null } {
  const mentioned = domainMentionedInText(responseText, domain);
  if (!mentioned) {
    return { mentioned: false, position: null };
  }

  const lines = responseText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const listLines = lines.filter((l) => {
    return (
      /^\d{1,2}[\.)]\s/.test(l) ||
      /^[-*•]\s/.test(l) ||
      /^\[[\d.]+\]/.test(l)
    );
  });

  const norm = normalizeDomain(domain);

  for (let i = 0; i < listLines.length; i++) {
    const line = listLines[i].toLowerCase();
    if (line.includes(norm) || line.includes(norm.replace(/^www\./, ""))) {
      return { mentioned: true, position: i + 1 };
    }
  }

  const lower = responseText.toLowerCase();
  const indices = [norm, `www.${norm}`]
    .map((v) => lower.indexOf(v))
    .filter((i) => i >= 0);
  const idx = indices.length > 0 ? Math.min(...indices) : -1;

  if (idx < 0) {
    return { mentioned: true, position: 1 };
  }

  const ratio = idx / Math.max(lower.length, 1);
  const rough = Math.max(1, Math.min(15, Math.ceil(ratio * 10) + 1));
  return { mentioned: true, position: rough };
}
