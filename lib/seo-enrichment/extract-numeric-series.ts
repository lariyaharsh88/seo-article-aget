/**
 * Pull real numeric pairs from prose for QuickChart — no fabricated values.
 * Returns null if we cannot find at least two usable points.
 */
export function extractNumericSeries(text: string): {
  labels: string[];
  values: number[];
} | null {
  const pairs: { label: string; value: number }[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 4) continue;

    const pct = trimmed.match(
      /^(.{2,50}?)[\s:—–-]+(\d+(?:\.\d+)?)\s*%/i,
    );
    if (pct) {
      const v = parseFloat(pct[2]);
      if (!Number.isNaN(v)) {
        pairs.push({
          label: pct[1].replace(/^[-*•\d.)\s]+/, "").trim().slice(0, 32),
          value: v,
        });
      }
      continue;
    }

    const money = trimmed.match(
      /^(.{2,45}?)[\s:—–-]+\$([\d,]+(?:\.\d+)?)\b/i,
    );
    if (money) {
      const v = parseFloat(money[2].replace(/,/g, ""));
      if (!Number.isNaN(v)) {
        pairs.push({
          label: money[1].replace(/^[-*•\d.)\s]+/, "").trim().slice(0, 32),
          value: v,
        });
      }
    }
  }

  if (pairs.length < 2) {
    return null;
  }

  const cap = pairs.slice(0, 8);
  return {
    labels: cap.map((p) => p.label || "—"),
    values: cap.map((p) => p.value),
  };
}
