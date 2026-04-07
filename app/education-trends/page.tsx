import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import {
  fetchEducationTrends,
  type EducationTrendRow,
} from "@/lib/education-trends";

export const metadata: Metadata = {
  title: "Education Google Trends",
  description:
    "Education-related trending searches and topics from Google Trends (aggregated).",
};

const GEO_PRESETS = ["US", "IN", "GB", "AU", "CA"] as const;

function sourceLabel(source: EducationTrendRow["source"]): string {
  switch (source) {
    case "realtime_trends":
      return "Realtime";
    case "daily_trends":
      return "Daily";
    case "related_queries_rising":
      return "Related Q · Rising";
    case "related_queries_top":
      return "Related Q · Top";
    case "related_topics_rising":
      return "Related topic · Rising";
    case "related_topics_top":
      return "Related topic · Top";
    default:
      return source;
  }
}

function sourceStyle(source: EducationTrendRow["source"]): string {
  if (source === "realtime_trends") return "bg-info/15 text-info";
  if (source === "daily_trends") return "bg-purple/20 text-purple";
  if (source.includes("rising")) return "bg-accent/15 text-accent";
  return "bg-text-muted/20 text-text-secondary";
}

const getCachedEducationTrends = unstable_cache(
  async (geo: string) => fetchEducationTrends(geo),
  ["education-trends-v1"],
  { revalidate: 900 },
);

export default async function EducationTrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ geo?: string }> | { geo?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const rawGeo = typeof sp.geo === "string" ? sp.geo : "US";
  const geo = rawGeo.trim().toUpperCase() || "US";

  const data = await getCachedEducationTrends(geo);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8 space-y-3 border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Google Trends · Education domain
        </p>
        <h1 className="font-display text-3xl text-text-primary md:text-4xl">
          Trending education topics
        </h1>
        <p className="max-w-3xl font-serif text-text-secondary">
          Queries and stories tied to the education space: related searches around
          core keywords, topic momentum, plus daily and realtime trends whose titles
          match an education lexicon. Data is read from public Google Trends endpoints
          via{" "}
          <a
            href="https://www.npmjs.com/package/google-trends-api"
            className="text-info underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            google-trends-api
          </a>{" "}
          (unofficial). Availability and fields can change; refresh is cached ~15
          minutes.
        </p>
        <p className="font-mono text-xs text-text-muted">
          Fetched {new Date(data.fetchedAt).toLocaleString()} · Region{" "}
          <strong className="text-text-secondary">{data.geo}</strong>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-text-muted">Region:</span>
        {GEO_PRESETS.map((g) => (
          <Link
            key={g}
            href={`/education-trends?geo=${g}`}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors duration-200 ${
              g === geo
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            {g}
          </Link>
        ))}
      </div>

      {data.warnings.length > 0 && (
        <div
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 font-mono text-xs text-amber-100"
          role="status"
        >
          <p className="font-semibold text-amber-200">Partial data / notices</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {data.items.length === 0 ? (
        <p className="font-serif text-text-secondary">
          No education-scoped trends returned for this region right now. Try another
          region or retry in a few minutes (Google may throttle).
        </p>
      ) : (
        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-border bg-surface/80">
          <table className="w-full min-w-[640px] border-collapse text-left font-serif text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Explore</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/80 transition-colors duration-150 hover:bg-background/50"
                >
                  <td className="px-4 py-3 text-text-primary">{row.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${sourceStyle(row.source)}`}
                    >
                      {sourceLabel(row.source)}
                    </span>
                    {row.seed ? (
                      <span className="mt-1 block font-mono text-[10px] text-text-muted">
                        Seed: {row.seed}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-text-secondary">
                    {row.metric}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={row.exploreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-info underline-offset-2 hover:underline"
                    >
                      Open in Trends ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 font-mono text-[10px] leading-relaxed text-text-muted">
        Sources merged: {data.dataSourcesUsed.join(", ") || "—"}
      </p>
    </main>
  );
}
