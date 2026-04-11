/** Free chart images via QuickChart (Chart.js) — no API key for typical use. @see https://quickchart.io/ */

const BASE = "https://quickchart.io/chart";

export function quickChartImageUrl(chart: Record<string, unknown>): string {
  const params = new URLSearchParams({
    width: "640",
    height: "400",
    backgroundColor: "white",
    format: "png",
    version: "4",
    chart: JSON.stringify(chart),
  });
  return `${BASE}?${params.toString()}`;
}
