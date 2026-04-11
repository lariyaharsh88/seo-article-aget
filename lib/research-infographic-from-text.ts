import {
  buildInfographicByKind,
  pickInfographicKind,
  svgToDataUrl,
  type InfographicKind,
} from "@/lib/infographic-svg";
import type { ResearchImageAsset } from "@/lib/types";

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Extract decimal numbers (handles comma thousands). */
export function parseNumbersFromText(s: string): number[] {
  const re = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  const str = s.replace(/\s+/g, " ");
  while ((m = re.exec(str)) !== null) {
    const n = parseFloat(m[0].replace(/,/g, ""));
    if (!Number.isNaN(n)) out.push(n);
  }
  return out;
}

function mostlyYears(nums: number[]): boolean {
  if (nums.length < 2) return false;
  return nums.every(
    (n) => Number.isInteger(n) && n >= 1900 && n <= 2100,
  );
}

/** Lines and sentences that might contain comparable figures. */
function splitIntoDataCandidates(text: string): string[] {
  const t = text.replace(/\r/g, "").trim();
  if (!t) return [];
  const out: string[] = [];
  for (const block of t.split(/\n\n+/)) {
    const lines = block
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s+/, "").trim())
      .filter((l) => l.length >= 15 && l.length <= 520);
    out.push(...lines);
    const sentences = block
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 20 && s.length <= 520);
    out.push(...sentences);
  }
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const s of out) {
    const k = s.slice(0, 120).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(s);
  }
  return uniq;
}

const KIND_LABEL: Record<InfographicKind, string> = {
  comparison: "Comparison",
  factsRow: "Facts strip",
  grid: "Data grid",
  triple: "Triple highlight",
};

/**
 * Builds SVG infographic assets from numeric data in research text.
 * Renders locally as data URLs — no chart API, no LLM for images.
 */
export function buildResearchInfographicAssets(
  researchContext: string,
  topic: string,
  maxImages: number,
): ResearchImageAsset[] {
  const candidates = splitIntoDataCandidates(researchContext);
  const assets: ResearchImageAsset[] = [];
  let idx = 0;

  for (const excerpt of candidates) {
    if (assets.length >= maxImages) break;
    const nums = parseNumbersFromText(excerpt);
    if (nums.length < 2 || nums.length > 8) continue;
    if (mostlyYears(nums)) continue;

    const kind = pickInfographicKind(nums.length, idx);
    idx += 1;

    const valuesForSvg =
      kind === "grid" && nums.length > 6 ? nums.slice(0, 6) : [...nums];

    const headline = truncate(`${topic}: ${excerpt}`, 96);
    const svg = buildInfographicByKind(kind, headline, valuesForSvg);
    const url = svgToDataUrl(svg);

    const kl = KIND_LABEL[kind];

    assets.push({
      url,
      dataPoint: excerpt.slice(0, 400),
      alt: `${kl} infographic · ${valuesForSvg.length} values from research`,
      insight: `${kl} layout: figures are drawn from this excerpt in order. Vector SVG (no raster chart API).`,
      templateLabel: `SVG infographic · ${kind}`,
    });
  }

  return assets;
}
