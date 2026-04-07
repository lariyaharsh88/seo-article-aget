import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import {
  fetchEducationTrends,
  parseEducationTimeframe,
  type EducationTimeframe,
  type EducationTrendRow,
  type ExploreQueryRow,
} from "@/lib/education-trends";

export const metadata: Metadata = {
  title: "Education Google Trends",
  description:
    "Education-related Top and Rising queries in the style of Google Trends Explore (India-focused seeds: exams, results, dates, admit cards, and more).",
};

const GEO_PRESETS = ["IN", "US", "GB", "AU", "CA"] as const;

const TIMEFRAMES: { id: EducationTimeframe; label: string }[] = [
  { id: "past_24_hours", label: "Past 24 hours" },
  { id: "past_7_days", label: "Past 7 days" },
  { id: "past_90_days", label: "Past 90 days" },
];

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
  if (source === "realtime_trends") return "bg-sky-100 text-sky-800";
  if (source === "daily_trends") return "bg-violet-100 text-violet-800";
  if (source.includes("rising")) return "bg-emerald-100 text-emerald-800";
  return "bg-slate-200 text-slate-700";
}

function changeCellClass(dir: ExploreQueryRow["changeDirection"]): string {
  if (dir === "breakout") return "font-semibold text-violet-700";
  if (dir === "up") return "text-emerald-700";
  if (dir === "down") return "text-rose-700";
  return "text-slate-500";
}

function qs(geo: string, tf: EducationTimeframe): string {
  const p = new URLSearchParams();
  p.set("geo", geo);
  p.set("tf", tf);
  return p.toString();
}

const getCachedEducationTrends = unstable_cache(
  async (geo: string, timeframe: EducationTimeframe) =>
    fetchEducationTrends(geo, { timeframe }),
  ["education-trends-explore-v3"],
  { revalidate: 900 },
);

export default async function EducationTrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ geo?: string; tf?: string }> | { geo?: string; tf?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const rawGeo = typeof sp.geo === "string" ? sp.geo : "IN";
  const geo = rawGeo.trim().toUpperCase() || "IN";
  const timeframe = parseEducationTimeframe(sp.tf);

  const data = await getCachedEducationTrends(geo, timeframe);

  return (
    <main className="min-h-screen bg-[#f1f3f4] pb-12 text-slate-900">
      <div className="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Google Trends · Education (aggregated)
          </p>
          <h1 className="mt-2 text-2xl font-normal tracking-tight text-slate-900 md:text-3xl">
            Explore education searches
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            Top and Rising related queries are pulled from many education seeds — results, exam
            dates, admit cards, applications,{" "}
            <span className="whitespace-nowrap">JEE Main</span>, NEET, boards, admissions, and
            more — then merged like a custom Explore view. India uses an India-specific seed list;
            other regions use a broader set. Unofficial{" "}
            <a
              href="https://www.npmjs.com/package/google-trends-api"
              className="text-blue-600 underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              google-trends-api
            </a>
            ; cache ~15 min. Bars are relative within each list, not absolute search volume.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Fetched {new Date(data.fetchedAt).toLocaleString()} · Web search ·{" "}
            <span className="font-medium text-slate-700">{data.explore.timeframeLabel}</span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        {/* Filter bar — Explore-style */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:flex-wrap md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Location</span>
            <div className="flex flex-wrap gap-1">
              {GEO_PRESETS.map((g) => (
                <Link
                  key={g}
                  href={`/education-trends?${qs(g, timeframe)}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    g === geo
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {g === "IN" ? "India" : g}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Timeframe</span>
            <div className="flex flex-wrap gap-1">
              {TIMEFRAMES.map((t) => (
                <Link
                  key={t.id}
                  href={`/education-trends?${qs(geo, t.id)}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    t.id === timeframe
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Search type</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
              Web Search
            </span>
          </div>
        </div>

        {data.warnings.length > 0 && (
          <div
            className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950"
            role="status"
          >
            <p className="font-semibold text-amber-900">Partial data / notices</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {data.explore.top.length === 0 && data.explore.rising.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            No Top / Rising related queries returned for this region and timeframe. Try Past 7 or
            90 days, or another region (Google may throttle short windows).
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <ExploreCard
              title="Top queries"
              subtitle="Higher relative interest in related-queries “top” lists (merged across education seeds)."
              rows={data.explore.top}
              geo={geo}
            />
            <ExploreCard
              title="Rising queries"
              subtitle="Largest growth in related-queries “rising” lists; BREAKOUT = sharp spike."
              rows={data.explore.rising}
              geo={geo}
            />
          </div>
        )}

        {/* Raw feed (optional detail) */}
        {data.items.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-medium text-slate-800">All merged signals</h2>
            <p className="mb-3 text-xs text-slate-600">
              Includes related topics, daily and realtime education-scoped titles, plus every seed row
              (deduped by title).
            </p>
            <div className="custom-scrollbar overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
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
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${sourceStyle(row.source)}`}
                        >
                          {sourceLabel(row.source)}
                        </span>
                        {row.seed ? (
                          <span className="mt-1 block font-mono text-[10px] text-slate-500">
                            Seed: {row.seed}
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-slate-600">{row.metric}</td>
                      <td className="px-4 py-3">
                        <a
                          href={row.exploreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                        >
                          Open in Trends ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-8 text-[10px] leading-relaxed text-slate-500">
          Sources merged: {data.dataSourcesUsed.join(", ") || "—"}
        </p>
      </div>
    </main>
  );
}

function ExploreCard({
  title,
  subtitle,
  rows,
  geo,
}: {
  title: string;
  subtitle: string;
  rows: ExploreQueryRow[];
  geo: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-base font-medium text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-1 text-slate-400" aria-hidden>
          <span className="rounded p-1 hover:bg-slate-100" title="Download (preview)">
            <DownloadIcon />
          </span>
          <span className="rounded p-1 hover:bg-slate-100" title="About this list">
            <InfoIcon />
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">No rows for this timeframe.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                <th className="w-10 px-3 py-2" aria-label="Rank" />
                <th className="px-3 py-2">Query</th>
                <th className="hidden min-w-[140px] px-3 py-2 sm:table-cell">Search interest</th>
                <th className="min-w-[100px] px-3 py-2 text-right">Change</th>
                <th className="w-8 px-1 py-2" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.rank}-${row.query}`}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-3 py-2.5 align-middle tabular-nums text-xs text-slate-400">
                    {row.rank}
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5 align-middle sm:max-w-none">
                    <a
                      href={row.exploreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {row.query}
                    </a>
                    <div className="mt-1 sm:hidden">
                      <InterestBar value={row.interest} />
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 align-middle sm:table-cell">
                    <InterestBar value={row.interest} />
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right align-middle text-xs font-medium ${changeCellClass(row.changeDirection)}`}
                  >
                    <span className="inline-flex items-center justify-end gap-0.5">
                      {row.changeDirection === "up" ? <ArrowUp /> : null}
                      {row.changeDirection === "down" ? <ArrowDown /> : null}
                      {row.changeLabel}
                    </span>
                  </td>
                  <td className="px-1 py-2.5 align-middle text-slate-300">
                    <MoreIcon />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
        Region {geo} · Opens google.com/trends for the same query
      </p>
    </section>
  );
}

function InterestBar({ value }: { value: number }) {
  const w = Math.max(4, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 min-w-[72px] flex-1 overflow-hidden rounded-sm bg-slate-100">
        <div
          className="h-full rounded-sm bg-[#1a73e8]"
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-slate-500">{value}</span>
    </div>
  );
}

function ArrowUp() {
  return (
    <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 5l5 5H5l5-5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg className="h-3.5 w-3.5 text-rose-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 15l-5-5h10l-5 5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg className="mx-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M6 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}
