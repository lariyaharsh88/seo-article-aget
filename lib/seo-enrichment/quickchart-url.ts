/**
 * QuickChart (no API key) — chart image URL from structured config.
 * @see https://quickchart.io/documentation/
 */
export function buildBarChartUrl(
  labels: string[],
  values: number[],
  title: string,
): string {
  const chart = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "From article",
          data: values,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title.slice(0, 80),
        },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chart))}&width=640&height=420&format=png&devicePixelRatio=2`;
}
