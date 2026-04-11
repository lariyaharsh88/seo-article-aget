import type { VisualKind } from "./types";

/**
 * Route section to chart / table / illustration using lightweight heuristics.
 * Charts only when we can later extract real numbers from the same text.
 */
export function classifySection(body: string, title: string): VisualKind {
  const combined = `${title}\n${body}`;
  const t = combined.toLowerCase();

  const looksLikeComparison =
    /\b(vs\.?|versus|compared to|comparison|difference between|pros and cons|which (one |option )?is better|or \w+\?)\b/i.test(
      t,
    ) || /^\s*\|.+\|/m.test(body);

  if (looksLikeComparison && body.length > 120) {
    return "table";
  }

  const hasMultipleNumbers =
    (body.match(/\d+(?:\.\d+)?%|\$[\d,]+|\d{1,3}(?:,\d{3})+|\d+\s*(?:million|billion|k\b|%)/gi) ?? [])
      .length >= 2;

  if (hasMultipleNumbers) {
    return "chart";
  }

  return "illustration";
}
