import { quickChartImageUrl } from "@/lib/quickchart-url";
import type { ResearchImageAsset } from "@/lib/types";

type ChartKind = "bar" | "horizontalBar" | "pie";

const COLORS = [
  "rgba(54, 162, 235, 0.75)",
  "rgba(255, 99, 132, 0.75)",
  "rgba(75, 192, 192, 0.75)",
  "rgba(255, 206, 86, 0.75)",
  "rgba(153, 102, 255, 0.75)",
  "rgba(255, 159, 64, 0.75)",
  "rgba(199, 199, 199, 0.75)",
  "rgba(83, 102, 255, 0.75)",
];

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

function pickChartKind(n: number, index: number): ChartKind {
  if (n >= 3 && n <= 5 && index % 3 === 1) return "pie";
  if (index % 2 === 1) return "horizontalBar";
  return "bar";
}

function buildChartConfig(
  kind: ChartKind,
  labels: string[],
  values: number[],
  title: string,
): Record<string, unknown> {
  const colors = labels.map((_, i) => COLORS[i % COLORS.length]);
  const baseTitle = {
    display: true,
    text: truncate(title, 96),
    font: { size: 14 },
  };

  if (kind === "pie") {
    return {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 1,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        plugins: {
          title: baseTitle,
          legend: { display: true, position: "bottom" },
        },
      },
    };
  }

  const horizontal = kind === "horizontalBar";
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Values (from research text)",
          data: values,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      plugins: {
        title: baseTitle,
        legend: { display: false },
      },
      scales: {
        x: horizontal
          ? { beginAtZero: true }
          : { grid: { display: false } },
        y: horizontal
          ? { grid: { display: false } }
          : { beginAtZero: true },
      },
    },
  };
}

/**
 * Builds chart image assets from numeric data found in research text.
 * Uses QuickChart only — no LLM. Each asset maps to one excerpt with 2+ numbers.
 */
export function buildResearchChartAssets(
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

    const labels = nums.map((_, i) => `#${i + 1}`);
    const kind = pickChartKind(nums.length, idx);
    idx += 1;

    const title = truncate(`${topic}: ${excerpt}`, 88);
    const chart = buildChartConfig(kind, labels, nums, title);
    const url = quickChartImageUrl(chart);

    const kindLabel =
      kind === "pie" ? "pie" : kind === "horizontalBar" ? "horizontal bar" : "bar";

    assets.push({
      url,
      dataPoint: excerpt.slice(0, 400),
      alt: `${kindLabel} chart of ${nums.length} values from research`,
      insight: `Template chart (${kindLabel}) built from the figures in this excerpt. Rendered by QuickChart (free).`,
      templateLabel: `QuickChart · ${kindLabel}`,
    });
  }

  return assets;
}
