import { escapeXml } from "@/lib/svg-text";

const W = 800;
const H = 440;

const ACCENTS = ["#0ea5e9", "#8b5cf6", "#f97316", "#10b981", "#ec4899", "#6366f1"];

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function wrapLines(text: string, maxLen: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length >= maxLines - 1) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

function formatFigure(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3 && a >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (Number.isInteger(n)) return String(n);
  const t = n.toFixed(2).replace(/\.?0+$/, "");
  return t;
}

/** Two figures side by side with proportional bars — editorial infographic. */
export function buildComparisonInfographic(
  headline: string,
  values: [number, number],
): string {
  const [a, b] = values;
  const max = Math.max(a, b, 1);
  const pctA = Math.min(100, Math.max(0, (a / max) * 100));
  const pctB = Math.min(100, Math.max(0, (b / max) * 100));
  const titleLines = wrapLines(headline, 52, 2);
  const c0 = ACCENTS[0];
  const c1 = ACCENTS[1];

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${36 + i * 22}" text-anchor="middle" fill="#0f172a" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="15" font-weight="600">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f9ff"/>
      <stop offset="100%" style="stop-color:#f8fafc"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="24" y="12" width="${W - 48}" height="3" rx="1.5" fill="#e2e8f0"/>
  ${titleSvg}
  <g filter="url(#shadow)">
    <rect x="40" y="100" width="340" height="280" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
    <rect x="420" y="100" width="340" height="280" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
  </g>
  <text x="210" y="150" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.08em">FIGURE A</text>
  <text x="210" y="210" text-anchor="middle" fill="${c0}" font-family="system-ui, sans-serif" font-size="48" font-weight="800">${escapeXml(formatFigure(a))}</text>
  <rect x="70" y="240" width="280" height="14" rx="7" fill="#e2e8f0"/>
  <rect x="70" y="240" width="${(280 * pctA) / 100}" height="14" rx="7" fill="${c0}"/>
  <text x="600" y="150" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.08em">FIGURE B</text>
  <text x="600" y="210" text-anchor="middle" fill="${c1}" font-family="system-ui, sans-serif" font-size="48" font-weight="800">${escapeXml(formatFigure(b))}</text>
  <rect x="450" y="240" width="280" height="14" rx="7" fill="#e2e8f0"/>
  <rect x="450" y="240" width="${(280 * pctB) / 100}" height="14" rx="7" fill="${c1}"/>
  <circle cx="${W / 2}" cy="230" r="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="${W / 2}" y="237" text-anchor="middle" fill="#475569" font-family="system-ui, sans-serif" font-size="13" font-weight="700">vs</text>
  <text x="${W / 2}" y="400" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Scaled bars use the larger value as 100% within this excerpt.</text>
</svg>`;
}

/** 3–4 key figures in a horizontal infographic strip. */
export function buildFactsRowInfographic(headline: string, values: number[]): string {
  const slice = values.slice(0, 4);
  const gap = 16;
  const cardW = (W - 48 - gap * (slice.length - 1)) / slice.length;
  const titleLines = wrapLines(headline, 56, 2);
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${32 + i * 20}" text-anchor="middle" fill="#0f172a" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${escapeXml(line)}</text>`,
    )
    .join("");

  const cards = slice
    .map((v, i) => {
      const x = 24 + i * (cardW + gap);
      const ac = ACCENTS[i % ACCENTS.length];
      return `
  <g>
    <rect x="${x}" y="88" width="${cardW}" height="300" rx="18" fill="#ffffff" stroke="#e2e8f0" filter="url(#shadow)"/>
    <rect x="${x}" y="88" width="${cardW}" height="6" rx="3" fill="${ac}"/>
    <text x="${x + cardW / 2}" y="200" text-anchor="middle" fill="${ac}" font-family="system-ui, sans-serif" font-size="36" font-weight="800">${escapeXml(formatFigure(v))}</text>
    <text x="${x + cardW / 2}" y="240" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" font-weight="600" letter-spacing="0.06em">VALUE ${i + 1}</text>
  </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" style="stop-color:#faf5ff"/>
      <stop offset="100%" style="stop-color:#f8fafc"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-opacity="0.1"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg2)"/>
  ${titleSvg}
  ${cards}
  <text x="${W / 2}" y="415" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Facts row · values appear in order from your research text</text>
</svg>`;
}

/** 4–6 figures in a 2-column grid (capped for layout). */
export function buildGridInfographic(headline: string, values: number[]): string {
  const slice = values.slice(0, 6);
  const cols = 2;
  const rows = Math.ceil(slice.length / 2);
  const pad = 24;
  const gridTop = 68;
  const gridBottom = 420;
  const cellW = (W - pad * 3) / cols;
  const cellH = (gridBottom - gridTop - (rows - 1) * 10) / rows;
  const titleLines = wrapLines(headline, 58, 2);
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${28 + i * 20}" text-anchor="middle" fill="#0f172a" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${escapeXml(line)}</text>`,
    )
    .join("");

  const cells = slice
    .map((v, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + pad);
      const y = gridTop + row * (cellH + 10);
      const ac = ACCENTS[i % ACCENTS.length];
      return `
  <rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="${x}" y="${y}" width="${cellW}" height="5" rx="2.5" fill="${ac}"/>
  <text x="${x + cellW / 2}" y="${y + cellH / 2 + 8}" text-anchor="middle" fill="${ac}" font-family="system-ui, sans-serif" font-size="28" font-weight="800">${escapeXml(formatFigure(v))}</text>
  <text x="${x + cellW / 2}" y="${y + cellH - 16}" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" font-weight="600">#${i + 1}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style="stop-color:#fff7ed"/>
      <stop offset="100%" style="stop-color:#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg3)"/>
  ${titleSvg}
  ${cells}
  <text x="${W / 2}" y="${H - 14}" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Data grid · figures from the same research excerpt</text>
</svg>`;
}

/** 3 values: optional donut-style summary using arcs — simplified as three stat orbs. */
export function buildTripleHighlightInfographic(headline: string, values: [number, number, number]): string {
  const [a, b, c] = values;
  const titleLines = wrapLines(headline, 54, 2);
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${34 + i * 22}" text-anchor="middle" fill="#0f172a" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${escapeXml(line)}</text>`,
    )
    .join("");
  const triple = [
    { v: a, x: 130, c: ACCENTS[0] },
    { v: b, x: 400, c: ACCENTS[1] },
    { v: c, x: 670, c: ACCENTS[2] },
  ];

  const blobs = triple
    .map(
      ({ v, x, c }) => `
  <circle cx="${x}" cy="220" r="72" fill="${c}" fill-opacity="0.15" stroke="${c}" stroke-width="3"/>
  <text x="${x}" y="232" text-anchor="middle" fill="${c}" font-family="system-ui, sans-serif" font-size="34" font-weight="800">${escapeXml(formatFigure(v))}</text>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f8fafc"/>
  ${titleSvg}
  ${blobs}
  <text x="${W / 2}" y="360" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="12">Three key figures · infographic snapshot</text>
  <text x="${W / 2}" y="395" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Numbers taken in order from your research excerpt</text>
</svg>`;
}

export type InfographicKind =
  | "comparison"
  | "factsRow"
  | "grid"
  | "triple";

export function buildInfographicByKind(
  kind: InfographicKind,
  headline: string,
  values: number[],
): string {
  if (kind === "comparison" && values.length >= 2) {
    return buildComparisonInfographic(headline, [values[0], values[1]]);
  }
  if (kind === "triple" && values.length >= 3) {
    return buildTripleHighlightInfographic(headline, [
      values[0],
      values[1],
      values[2],
    ]);
  }
  if (kind === "factsRow" && values.length >= 3 && values.length <= 4) {
    return buildFactsRowInfographic(headline, values);
  }
  if (kind === "grid") {
    return buildGridInfographic(headline, values);
  }
  if (values.length === 2) {
    return buildComparisonInfographic(headline, [values[0], values[1]]);
  }
  if (values.length === 3) {
    return buildTripleHighlightInfographic(headline, [
      values[0],
      values[1],
      values[2],
    ]);
  }
  if (values.length <= 4) {
    return buildFactsRowInfographic(headline, values);
  }
  return buildGridInfographic(headline, values);
}

export function pickInfographicKind(
  n: number,
  index: number,
): InfographicKind {
  if (n === 2) return "comparison";
  if (n === 3) return index % 2 === 0 ? "triple" : "factsRow";
  if (n === 4) return index % 3 === 0 ? "factsRow" : "grid";
  return "grid";
}
